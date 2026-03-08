use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

/// Holds the running Python sidecar process.
struct SidecarState(Mutex<Option<CommandChild>>);

/// Set up the Python virtual environment and install dependencies.
/// Runs on first launch or when venv is missing.
#[tauri::command]
async fn setup_backend(app: AppHandle) -> Result<String, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;

    let backend_dir = resource_dir.join("backend");
    let venv_dir = backend_dir.join("venv");

    // Check if venv already exists
    let venv_python = if cfg!(target_os = "windows") {
        venv_dir.join("Scripts").join("python")
    } else {
        venv_dir.join("bin").join("python")
    };

    if venv_python.exists() {
        return Ok("Backend already set up".into());
    }

    // Create venv
    let shell = app.shell();
    let output = shell
        .command("python3")
        .args(["-m", "venv", venv_dir.to_str().unwrap()])
        .output()
        .await
        .map_err(|e| format!("Failed to create venv: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "Venv creation failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // Install dependencies
    let pip = if cfg!(target_os = "windows") {
        venv_dir.join("Scripts").join("pip")
    } else {
        venv_dir.join("bin").join("pip")
    };

    let requirements = backend_dir.join("requirements.txt");
    let output = shell
        .command(pip.to_str().unwrap())
        .args(["install", "-r", requirements.to_str().unwrap()])
        .output()
        .await
        .map_err(|e| format!("Failed to install deps: {e}"))?;

    if !output.status.success() {
        return Err(format!(
            "Pip install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok("Backend setup complete".into())
}

/// Start the FastAPI backend server as a sidecar process.
#[tauri::command]
async fn start_backend(app: AppHandle) -> Result<String, String> {
    let state = app.state::<SidecarState>();
    let mut child_lock = state.0.lock().map_err(|e| format!("Lock error: {e}"))?;

    // Already running
    if child_lock.is_some() {
        return Ok("Backend already running".into());
    }

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;

    let backend_dir = resource_dir.join("backend");
    let venv_dir = backend_dir.join("venv");

    let uvicorn = if cfg!(target_os = "windows") {
        venv_dir.join("Scripts").join("uvicorn")
    } else {
        venv_dir.join("bin").join("uvicorn")
    };

    let shell = app.shell();
    let (mut rx, child) = shell
        .command(uvicorn.to_str().unwrap())
        .args([
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "7860",
        ])
        .current_dir(backend_dir)
        .spawn()
        .map_err(|e| format!("Failed to start backend: {e}"))?;

    // Log sidecar output in background
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let _ = app_handle.emit("backend-log", &String::from_utf8_lossy(&line).to_string());
                }
                CommandEvent::Stderr(line) => {
                    let _ = app_handle.emit("backend-log", &String::from_utf8_lossy(&line).to_string());
                }
                CommandEvent::Terminated(payload) => {
                    let msg = format!("Backend exited with code: {:?}", payload.code);
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
        child.kill().map_err(|e| format!("Failed to kill backend: {e}"))?;
        Ok("Backend stopped".into())
    } else {
        Ok("Backend was not running".into())
    }
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
        .invoke_handler(tauri::generate_handler![
            setup_backend,
            start_backend,
            stop_backend,
            check_backend_health,
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
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
