use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

/// Holds the running Python sidecar process.
struct SidecarState(Mutex<Option<CommandChild>>);

/// Guards against concurrent setup_backend calls (e.g. React StrictMode double-invoke).
struct SetupGuard(AtomicBool);

/// Get the path to the bundled backend source code (read-only).
/// In dev mode, uses CARGO_MANIFEST_DIR to find the project backend directory.
/// In production, points to the bundled resources.
fn get_backend_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    if cfg!(debug_assertions) {
        // Dev mode: CARGO_MANIFEST_DIR is .../frontend/src-tauri/
        // Go up twice to project root, then into backend/
        let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
        let backend_dir = manifest_dir
            .parent()
            .and_then(|p| p.parent())
            .map(|p| p.join("backend"))
            .unwrap_or_default();
        if backend_dir.exists() {
            eprintln!("[CCBell] Dev mode backend dir: {}", backend_dir.display());
            return Ok(backend_dir);
        }
        eprintln!(
            "[CCBell] Dev mode backend dir not found at {}, falling back to bundled resources",
            backend_dir.display()
        );
    }
    // Production: bundled resources
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;
    Ok(resource_dir.join("backend"))
}

/// Get the path to the app data directory (writable, for venv).
fn get_data_dir(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {e}"))
}

/// Find an existing `uv` binary at well-known locations.
/// Returns the absolute path if found, None otherwise.
fn find_uv() -> Option<String> {
    let home = std::env::var("HOME").unwrap_or_default();

    let uv_paths = [
        format!("{}/.local/bin/uv", home),
        format!("{}/.cargo/bin/uv", home),
    ];

    for path in &uv_paths {
        if std::path::Path::new(path).exists() {
            eprintln!("[CCBell] Found uv at: {}", path);
            return Some(path.clone());
        }
    }
    None
}

/// Download and install `uv` package manager, then return its path.
/// Uses curl to download the official installer script.
async fn install_uv(
    shell: &tauri_plugin_shell::Shell<tauri::Wry>,
    app: &AppHandle,
) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_default();

    let _ = app.emit("backend-log", "Downloading uv package manager...");
    eprintln!("[CCBell] Installing uv...");

    // Download installer script to a temp file
    let data_dir = get_data_dir(app)?;
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {e}"))?;
    let installer = data_dir.join("install-uv.sh");

    let output = shell
        .command("/usr/bin/curl")
        .args([
            "-LsSf",
            "https://astral.sh/uv/install.sh",
            "-o",
            installer.to_str().unwrap(),
        ])
        .output()
        .await
        .map_err(|e| format!("Failed to download uv installer: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Failed to download uv installer: {}", stderr));
    }

    // Run installer (non-interactive)
    let output = shell
        .command("/bin/sh")
        .args([installer.to_str().unwrap()])
        .output()
        .await
        .map_err(|e| format!("Failed to run uv installer: {e}"))?;

    // Clean up installer script
    let _ = std::fs::remove_file(&installer);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("uv installation failed: {}", stderr));
    }

    // Find the installed binary
    let uv_path = format!("{}/.local/bin/uv", home);
    if std::path::Path::new(&uv_path).exists() {
        eprintln!("[CCBell] uv installed at: {}", uv_path);
        return Ok(uv_path);
    }

    let cargo_uv = format!("{}/.cargo/bin/uv", home);
    if std::path::Path::new(&cargo_uv).exists() {
        eprintln!("[CCBell] uv installed at: {}", cargo_uv);
        return Ok(cargo_uv);
    }

    Err("uv was installed but binary could not be found".into())
}

/// Find an existing uv, or install it. Returns the uv binary path.
async fn find_or_install_uv(
    shell: &tauri_plugin_shell::Shell<tauri::Wry>,
    app: &AppHandle,
) -> Result<String, String> {
    if let Some(uv) = find_uv() {
        return Ok(uv);
    }
    install_uv(shell, app).await
}

/// Auto-install Python 3.12 via uv and return the Python binary path.
async fn auto_install_python(
    shell: &tauri_plugin_shell::Shell<tauri::Wry>,
    app: &AppHandle,
) -> Result<String, String> {
    let uv = find_or_install_uv(shell, app).await?;

    let _ = app.emit("backend-log", "Installing Python 3.12 (via uv)...");
    eprintln!("[CCBell] Installing Python 3.12 via uv...");

    let output = shell
        .command(&uv)
        .args(["python", "install", "cpython-3.12"])
        .output()
        .await
        .map_err(|e| format!("Failed to install Python: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python installation failed: {}", stderr));
    }

    eprintln!("[CCBell] Python 3.12 installed via uv");

    // Find the newly installed Python in uv's managed directory
    let home = std::env::var("HOME").unwrap_or_default();
    let uv_python_base = format!("{}/.local/share/uv/python", home);

    if let Ok(entries) = std::fs::read_dir(&uv_python_base) {
        let mut python_paths: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.contains("cpython-3.12")
            })
            .collect();
        python_paths.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        for entry in python_paths {
            let python_bin = entry.path().join("bin").join("python3");
            if python_bin.exists() {
                let path_str = python_bin.to_string_lossy().to_string();
                eprintln!("[CCBell] Installed Python at: {}", path_str);
                return Ok(path_str);
            }
        }
    }

    Err("Python was installed via uv but binary could not be located".into())
}

/// Find a compatible Python (3.11 or 3.12) for ML dependencies.
/// Checks: PATH, uv-managed, pyenv, Homebrew, system python3.
/// As a last resort, installs Python 3.12 automatically via uv.
async fn find_python(
    shell: &tauri_plugin_shell::Shell<tauri::Wry>,
    app: &AppHandle,
) -> Result<String, String> {
    // Try versioned Python commands first (most compatible with ML packages)
    for cmd in &["python3.11", "python3.12"] {
        let result = shell.command(cmd).args(["--version"]).output().await;
        if let Ok(output) = result {
            if output.status.success() {
                eprintln!(
                    "[CCBell] Found {}: {}",
                    cmd,
                    String::from_utf8_lossy(&output.stdout).trim()
                );
                return Ok(cmd.to_string());
            }
        }
    }

    let home = std::env::var("HOME").unwrap_or_default();

    // Check uv-managed Python installations (~/.local/share/uv/python/)
    let uv_python_base = format!("{}/.local/share/uv/python", home);
    if let Ok(entries) = std::fs::read_dir(&uv_python_base) {
        let mut python_paths: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.contains("cpython-3.11") || name.contains("cpython-3.12")
            })
            .collect();
        // Sort to prefer 3.12 over 3.11
        python_paths.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        for entry in python_paths {
            let python_bin = entry.path().join("bin").join("python3");
            if python_bin.exists() {
                let path_str = python_bin.to_string_lossy().to_string();
                eprintln!("[CCBell] Found uv Python: {}", path_str);
                return Ok(path_str);
            }
        }
    }

    // Check pyenv installations (~/.pyenv/versions/)
    let pyenv_base = format!("{}/.pyenv/versions", home);
    if let Ok(entries) = std::fs::read_dir(&pyenv_base) {
        let mut python_paths: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| {
                let name = e.file_name().to_string_lossy().to_string();
                name.starts_with("3.12") || name.starts_with("3.11")
            })
            .collect();
        // Sort to prefer 3.12 over 3.11
        python_paths.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        for entry in python_paths {
            let python_bin = entry.path().join("bin").join("python3");
            if python_bin.exists() {
                let path_str = python_bin.to_string_lossy().to_string();
                eprintln!("[CCBell] Found pyenv Python: {}", path_str);
                return Ok(path_str);
            }
        }
    }

    // Check Homebrew paths (macOS ARM, macOS Intel, Linux)
    let brew_prefixes = [
        "/opt/homebrew/opt",                         // macOS ARM
        "/usr/local/opt",                            // macOS Intel
        &format!("{}/.linuxbrew/opt", home),         // Linux Homebrew (user)
        "/home/linuxbrew/.linuxbrew/opt",            // Linux Homebrew (system)
    ];
    for version in &["3.12", "3.11"] {
        for prefix in &brew_prefixes {
            let brew_path = format!("{}/python@{}/bin/python{}", prefix, version, version);
            if std::path::Path::new(&brew_path).exists() {
                eprintln!("[CCBell] Found Homebrew Python: {}", brew_path);
                return Ok(brew_path);
            }
        }
    }

    // Fall back to system python3 (might be 3.13+ which has limited ML support)
    let result = shell.command("python3").args(["--version"]).output().await;
    if let Ok(output) = result {
        if output.status.success() {
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            eprintln!(
                "[CCBell] Warning: falling back to system python3 ({})",
                version
            );
            return Ok("python3".to_string());
        }
    }

    // Last resort: auto-install Python 3.12 via uv (requires internet)
    eprintln!("[CCBell] No Python found on system, attempting automatic installation...");
    let _ = app.emit("backend-log", "No Python found, installing automatically...");

    match auto_install_python(shell, app).await {
        Ok(path) => return Ok(path),
        Err(e) => {
            eprintln!("[CCBell] Auto-install failed: {}", e);
        }
    }

    let install_hint = if cfg!(target_os = "macos") {
        "Install via Homebrew: brew install python@3.12\n\
         Or download from: https://www.python.org/downloads/"
    } else {
        "Install via package manager:\n\
         - Ubuntu/Debian: sudo apt install python3.12 python3.12-venv\n\
         - Fedora: sudo dnf install python3.12\n\
         Or use pyenv: pyenv install 3.12"
    };

    Err(format!(
        "Python 3.11 or 3.12 is required but not found.\n\
         Automatic installation also failed.\n\n{}",
        install_hint
    ))
}

/// Get the settings file path.
fn get_settings_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let data_dir = get_data_dir(app)?;
    Ok(data_dir.join("settings.json"))
}

/// Read app settings from disk.
#[tauri::command]
async fn get_settings(app: AppHandle) -> Result<serde_json::Value, String> {
    let path = get_settings_path(&app)?;
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let contents = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read settings: {e}"))?;
    serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse settings: {e}"))
}

/// Write app settings to disk.
#[tauri::command]
async fn save_settings(app: AppHandle, settings: serde_json::Value) -> Result<(), String> {
    let data_dir = get_data_dir(&app)?;
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {e}"))?;
    let path = get_settings_path(&app)?;
    let contents = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {e}"))?;
    std::fs::write(&path, contents)
        .map_err(|e| format!("Failed to write settings: {e}"))
}

/// Set up the Python virtual environment and install dependencies.
/// Runs on first launch or when venv is missing.
/// - Venv is created in app_data_dir (writable)
/// - Requirements are read from resource_dir (bundled, read-only)
/// - Protected against concurrent calls (e.g. React StrictMode double-invoke)
#[tauri::command]
async fn setup_backend(app: AppHandle) -> Result<String, String> {
    // Prevent concurrent setup calls (React StrictMode can double-invoke effects)
    let guard = app.state::<SetupGuard>();
    if guard.0.swap(true, Ordering::SeqCst) {
        eprintln!("[CCBell] Setup already in progress, skipping duplicate call");
        // Wait for the other setup to finish by polling for the completion marker.
        // We use a marker file instead of checking for uvicorn because pip may install
        // uvicorn before all other dependencies are ready.
        let data_dir = get_data_dir(&app)?;
        let setup_marker = data_dir.join(".setup-complete");
        for _ in 0..600 {
            // Up to 5 minutes
            if setup_marker.exists() {
                return Ok("Backend already set up".into());
            }
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        }
        return Err("Setup timed out waiting for concurrent setup to complete".into());
    }

    // Run the actual setup, always resetting the guard afterward
    let result = setup_backend_inner(&app).await;
    guard.0.store(false, Ordering::SeqCst);
    result
}

/// Inner implementation of setup_backend (separated for guard cleanup).
async fn setup_backend_inner(app: &AppHandle) -> Result<String, String> {
    let backend_dir = get_backend_dir(app)?;
    let data_dir = get_data_dir(app)?;
    let venv_dir = data_dir.join("venv");

    // Ensure data directory exists
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| format!("Failed to create data dir: {e}"))?;

    // Check if setup already completed (marker file written after all deps installed)
    let setup_marker = data_dir.join(".setup-complete");

    if setup_marker.exists() {
        return Ok("Backend already set up".into());
    }

    // Find a compatible Python version (may auto-install via uv)
    let shell = app.shell();
    let _ = app.emit("backend-log", "Finding compatible Python version...");
    let python_cmd = find_python(shell, app).await?;
    eprintln!("[CCBell] Using Python: {}", python_cmd);

    // Check if uv is available for faster dependency installation
    let uv_path = find_uv();

    // Create venv
    let venv_python = venv_dir.join("bin").join("python");

    if !venv_python.exists() {
        let _ = app.emit("backend-log", "Creating Python virtual environment...");
        eprintln!("[CCBell] Creating venv at: {}", venv_dir.display());

        let (success, stderr_text) = if let Some(ref uv) = uv_path {
            // Use uv for faster venv creation
            eprintln!("[CCBell] Using uv to create venv");
            let output = shell
                .command(uv)
                .args([
                    "venv",
                    venv_dir.to_str().unwrap(),
                    "--python",
                    &python_cmd,
                ])
                .output()
                .await
                .map_err(|e| format!("Failed to create venv: {e}"))?;
            (
                output.status.success(),
                String::from_utf8_lossy(&output.stderr).to_string(),
            )
        } else {
            let output = shell
                .command(&python_cmd)
                .args(["-m", "venv", venv_dir.to_str().unwrap()])
                .output()
                .await
                .map_err(|e| format!("Failed to create venv: {e}"))?;
            (
                output.status.success(),
                String::from_utf8_lossy(&output.stderr).to_string(),
            )
        };

        if !success {
            // Handle race condition: if another process already created the venv dir
            if venv_python.exists() {
                eprintln!("[CCBell] Venv was created by concurrent process, continuing...");
            } else {
                eprintln!("[CCBell] Venv creation failed: {}", stderr_text);
                return Err(format!("Venv creation failed: {}", stderr_text));
            }
        } else {
            eprintln!("[CCBell] Venv created successfully");
        }
    } else {
        eprintln!("[CCBell] Venv exists, reinstalling dependencies...");
    }

    // Install dependencies from bundled requirements.txt
    let requirements = backend_dir.join("requirements.txt");

    eprintln!("[CCBell] Backend dir: {}", backend_dir.display());
    eprintln!("[CCBell] Requirements path: {}", requirements.display());

    if !requirements.exists() {
        return Err(format!(
            "requirements.txt not found at: {}",
            requirements.display()
        ));
    }

    if let Some(ref uv) = uv_path {
        // Fast path: use uv pip install (10-100x faster than pip)
        let _ = app.emit(
            "backend-log",
            "Installing Python dependencies with uv (this is fast)...",
        );
        eprintln!("[CCBell] Using uv pip install for faster dependency installation");

        let output = shell
            .command(uv)
            .args([
                "pip",
                "install",
                "--python",
                venv_dir.join("bin").join("python").to_str().unwrap(),
                "setuptools<81",
                "wheel",
                "-r",
                requirements.to_str().unwrap(),
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to install deps: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[CCBell] uv pip install failed: {}", stderr);
            return Err(format!("Dependency installation failed: {}", stderr));
        }
        eprintln!("[CCBell] uv pip install completed successfully");
    } else {
        // Slow path: regular pip install
        let pip = venv_dir.join("bin").join("pip");
        eprintln!("[CCBell] Pip path: {}", pip.display());

        // Upgrade pip and install setuptools first (required for Python 3.12+)
        let _ = app.emit("backend-log", "Upgrading pip and installing build tools...");
        eprintln!("[CCBell] Upgrading pip and installing setuptools...");

        let output = shell
            .command(pip.to_str().unwrap())
            .args(["install", "--upgrade", "pip", "setuptools<81", "wheel"])
            .output()
            .await
            .map_err(|e| format!("Failed to upgrade pip: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[CCBell] Pip upgrade failed: {}", stderr);
            return Err(format!("Pip upgrade failed: {}", stderr));
        }
        eprintln!("[CCBell] Pip/setuptools upgraded successfully");

        let _ = app.emit(
            "backend-log",
            "Installing Python dependencies (this may take a few minutes on first launch)...",
        );
        eprintln!("[CCBell] Starting pip install...");

        let output = shell
            .command(pip.to_str().unwrap())
            .args(["install", "-r", requirements.to_str().unwrap()])
            .output()
            .await
            .map_err(|e| format!("Failed to install deps: {e}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            eprintln!("[CCBell] Pip install failed: {}", stderr);
            return Err(format!("Pip install failed: {}", stderr));
        }
        eprintln!("[CCBell] Pip install completed successfully");
    }

    // Write setup completion marker so concurrent/future calls know setup is done.
    // This is more reliable than checking for individual binaries like uvicorn,
    // because pip may install uvicorn before all dependencies are ready.
    std::fs::write(&setup_marker, "ok")
        .map_err(|e| format!("Failed to write setup marker: {e}"))?;
    eprintln!(
        "[CCBell] Setup marker written at: {}",
        setup_marker.display()
    );

    Ok("Backend setup complete".into())
}

/// Start the FastAPI backend server as a sidecar process.
/// - Uses uvicorn from app_data_dir/venv
/// - Sets PYTHONPATH to resource_dir/backend so Python finds the app module
/// - Working directory is resource_dir/backend
#[tauri::command]
async fn start_backend(app: AppHandle) -> Result<String, String> {
    let state = app.state::<SidecarState>();
    let mut child_lock = state.0.lock().map_err(|e| format!("Lock error: {e}"))?;

    // Already running
    if child_lock.is_some() {
        return Ok("Backend already running".into());
    }

    let backend_dir = get_backend_dir(&app)?;
    let data_dir = get_data_dir(&app)?;
    let venv_dir = data_dir.join("venv");

    let uvicorn = venv_dir.join("bin").join("uvicorn");

    eprintln!("[CCBell] Starting backend...");
    eprintln!("[CCBell] Uvicorn: {}", uvicorn.display());
    eprintln!("[CCBell] Backend dir: {}", backend_dir.display());

    if !uvicorn.exists() {
        eprintln!(
            "[CCBell] ERROR: uvicorn not found at {}",
            uvicorn.display()
        );
        return Err("Backend not set up yet. Run setup first.".into());
    }

    // Read settings for GitHub token and concurrency
    let settings_path = get_settings_path(&app)?;
    let (github_token, max_concurrent) = if settings_path.exists() {
        let contents = std::fs::read_to_string(&settings_path).unwrap_or_default();
        let v: serde_json::Value = serde_json::from_str(&contents).unwrap_or_default();
        (
            v.get("github_token")
                .and_then(|t| t.as_str().map(String::from))
                .unwrap_or_default(),
            v.get("max_concurrent_generations")
                .and_then(|t| t.as_u64())
                .unwrap_or(2),
        )
    } else {
        (String::new(), 2)
    };

    let shell = app.shell();
    let mut cmd = shell.command(uvicorn.to_str().unwrap());
    cmd = cmd
        .args([
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "7860",
        ])
        .env("PYTHONPATH", backend_dir.to_str().unwrap());

    // Pass GitHub token if configured
    if !github_token.is_empty() {
        eprintln!("[CCBell] GitHub token configured, passing to backend");
        cmd = cmd.env("CCBELL_GH_TOKEN", &github_token);
    }

    // Pass concurrency setting
    eprintln!(
        "[CCBell] Max concurrent generations: {}",
        max_concurrent
    );
    cmd = cmd.env(
        "CCBELL_MAX_CONCURRENT_GENERATIONS",
        &max_concurrent.to_string(),
    );

    let (mut rx, child) = cmd.current_dir(&backend_dir).spawn().map_err(|e| {
        eprintln!("[CCBell] Failed to spawn uvicorn: {e}");
        format!("Failed to start backend: {e}")
    })?;

    eprintln!("[CCBell] Uvicorn process spawned");

    // Log sidecar output in background
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    eprintln!("[CCBell:stdout] {}", text);
                    let _ = app_handle.emit("backend-log", &text);
                }
                CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    eprintln!("[CCBell:stderr] {}", text);
                    let _ = app_handle.emit("backend-log", &text);
                }
                CommandEvent::Terminated(payload) => {
                    let msg = format!("Backend exited with code: {:?}", payload.code);
                    eprintln!("[CCBell] {}", msg);
                    let _ = app_handle.emit("backend-stopped", &msg);
                    break;
                }
                _ => {}
            }
        }
    });

    *child_lock = Some(child);
    Ok("Backend started on port 7860".into())
}

/// Stop the FastAPI backend server.
#[tauri::command]
async fn stop_backend(app: AppHandle) -> Result<String, String> {
    let state = app.state::<SidecarState>();
    let mut child_lock = state.0.lock().map_err(|e| format!("Lock error: {e}"))?;

    if let Some(child) = child_lock.take() {
        child
            .kill()
            .map_err(|e| format!("Failed to kill backend: {e}"))?;
        Ok("Backend stopped".into())
    } else {
        Ok("Backend was not running".into())
    }
}

/// Remove all CCBell-specific data from the system (venv, settings, model cache).
/// Stops the backend first if running. Does NOT remove uv or uv-managed Python.
#[tauri::command]
async fn uninstall_cleanup(app: AppHandle) -> Result<serde_json::Value, String> {
    // Stop backend first
    let state = app.state::<SidecarState>();
    if let Ok(mut child_lock) = state.0.lock() {
        if let Some(child) = child_lock.take() {
            let _ = child.kill();
            eprintln!("[CCBell] Backend stopped for uninstall");
        }
    }

    let mut removed = Vec::<String>::new();

    // Remove app data directory (venv, settings, setup marker)
    let data_dir = get_data_dir(&app)?;
    if data_dir.exists() {
        std::fs::remove_dir_all(&data_dir)
            .map_err(|e| format!("Failed to remove app data: {e}"))?;
        removed.push(format!("App data: {}", data_dir.display()));
        eprintln!("[CCBell] Removed app data: {}", data_dir.display());
    }

    // Remove model cache (~/.cache/ccbell-models/)
    let home = std::env::var("HOME").unwrap_or_default();
    let model_cache = std::path::PathBuf::from(&home).join(".cache").join("ccbell-models");
    if model_cache.exists() {
        std::fs::remove_dir_all(&model_cache)
            .map_err(|e| format!("Failed to remove model cache: {e}"))?;
        removed.push(format!("Model cache: {}", model_cache.display()));
        eprintln!("[CCBell] Removed model cache: {}", model_cache.display());
    }

    Ok(serde_json::json!({
        "success": true,
        "removed": removed,
    }))
}

/// Fetch a URL and return its raw bytes.
/// Used by the frontend to download audio blobs via Rust's HTTP client,
/// bypassing WKWebView restrictions that block cross-origin fetch in
/// production macOS builds (https://tauri.localhost → http://127.0.0.1:7860).
#[tauri::command]
async fn fetch_audio_bytes(url: String) -> Result<tauri::ipc::Response, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| format!("HTTP request failed: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    Ok(tauri::ipc::Response::new(bytes.to_vec()))
}

/// Check if the backend is healthy.
#[tauri::command]
async fn check_backend_health() -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client
        .get("http://127.0.0.1:7860/api/health")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
    {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState(Mutex::new(None)))
        .manage(SetupGuard(AtomicBool::new(false)))
        .invoke_handler(tauri::generate_handler![
            setup_backend,
            start_backend,
            stop_backend,
            check_backend_health,
            fetch_audio_bytes,
            get_settings,
            save_settings,
            uninstall_cleanup,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                // Kill backend when window closes
                let app = window.app_handle();
                let state = app.state::<SidecarState>();
                let mut child_lock = match state.0.lock() {
                    Ok(lock) => lock,
                    Err(_) => return,
                };
                if let Some(child) = child_lock.take() {
                    eprintln!("[CCBell] Window destroyed, stopping backend");
                    let _ = child.kill();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                // Ensure backend is killed when app exits (Cmd+Q, dock quit, etc.)
                let state = app.state::<SidecarState>();
                let mut child_lock = match state.0.lock() {
                    Ok(lock) => lock,
                    Err(_) => return,
                };
                if let Some(child) = child_lock.take() {
                    eprintln!("[CCBell] App exiting, stopping backend");
                    let _ = child.kill();
                }
            }
        });
}
