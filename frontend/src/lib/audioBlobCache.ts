/**
 * Global audio blob cache: blob URL → Blob.
 *
 * Populated by useGenerationQueue's toBlobUrl() after fetching audio from
 * the backend. Consumed by AudioPlayer to skip re-fetching blob URLs
 * (which fails in Tauri v2 production builds on macOS where WKWebView
 * restricts cross-context blob URL fetches).
 *
 * Extracted into its own module to avoid circular dependencies between
 * useGenerationQueue (writes) → useSoundLibrary (cleanup) → useGenerationQueue.
 */
export const audioBlobCache = new Map<string, Blob>()
