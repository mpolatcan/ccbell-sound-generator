/**
 * Hook to manage the Python backend lifecycle when running inside Tauri.
 * In web mode (HF Spaces / localhost dev), this is a no-op.
 */
import { useState, useEffect, useCallback } from 'react'

// Check if running inside Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface TauriBackendState {
  /** Whether the backend is ready to accept requests */
  ready: boolean
  /** Current setup stage description */
  stage: string
  /** Error message if setup failed */
  error: string | null
  /** Whether we're running inside Tauri (desktop) */
  isDesktop: boolean
  /** Retry setup after an error */
  retry: () => void
}

export function useTauriBackend(): TauriBackendState {
  const [ready, setReady] = useState(!isTauri) // Web mode is always ready
  const [stage, setStage] = useState(isTauri ? 'Initializing...' : '')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => {
    setError(null)
    setStage('Retrying...')
    setAttempt(a => a + 1)
  }, [])

  useEffect(() => {
    if (!isTauri) return

    let cancelled = false

    async function boot() {
      try {
        const { invoke } = await import('@tauri-apps/api/core')

        // Step 1: Setup Python venv (first run only)
        setStage('Setting up Python environment...')
        const setupResult = await invoke<string>('setup_backend')
        if (cancelled) return
        console.log('[Tauri]', setupResult)

        // Step 2: Start the FastAPI server
        setStage('Starting backend server...')
        const startResult = await invoke<string>('start_backend')
        if (cancelled) return
        console.log('[Tauri]', startResult)

        // Step 3: Wait for backend to be healthy
        setStage('Waiting for server to be ready...')
        let healthy = false
        for (let i = 0; i < 60; i++) { // Up to 30 seconds
          if (cancelled) return
          const ok = await invoke<boolean>('check_backend_health')
          if (ok) {
            healthy = true
            break
          }
          await new Promise(r => setTimeout(r, 500))
        }

        if (!healthy) {
          throw new Error('Backend failed to start within 30 seconds')
        }

        setStage('')
        setReady(true)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        console.error('[Tauri] Boot error:', message)
        setError(message)
        setStage('')
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [attempt])

  return { ready, stage, error, isDesktop: isTauri, retry }
}
