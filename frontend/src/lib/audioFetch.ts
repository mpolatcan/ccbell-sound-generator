/**
 * Fetch audio as a Blob, using Tauri IPC in desktop mode.
 *
 * In Tauri v2 production builds on macOS, WKWebView blocks cross-origin
 * fetch from https://tauri.localhost to http://127.0.0.1:7860. This module
 * routes audio downloads through a Rust command (reqwest) to bypass the
 * webview's networking restrictions entirely.
 *
 * In web mode (HuggingFace Spaces, Docker), uses regular fetch().
 */

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function fetchAudioBlob(url: string): Promise<Blob> {
  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const bytes = await invoke<ArrayBuffer>('fetch_audio_bytes', { url })
      console.log(`[audioFetch] IPC success: ${bytes.byteLength} bytes from ${url}`)
      return new Blob([bytes], { type: 'audio/wav' })
    } catch (ipcErr) {
      console.error(`[audioFetch] IPC failed for ${url}:`, ipcErr)
      // Fall through to regular fetch as last resort
      console.log('[audioFetch] Falling back to regular fetch...')
    }
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${res.status} ${res.statusText}`)
  return res.blob()
}
