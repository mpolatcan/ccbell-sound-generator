import { useCallback, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { audioBlobCache } from '@/lib/audioBlobCache'
import { fetchAudioBlob } from '@/lib/audioFetch'
import { useSoundLibrary } from './useSoundLibrary'
import type { GenerateRequest } from '@/types'
import { API_BASE_URL, WS_BASE_URL } from '@/lib/constants'

/**
 * Resolve a server URL to a full URL, prepending API_BASE_URL if needed.
 * In Tauri mode, relative URLs like /api/audio/xxx must be resolved against
 * the backend's real origin (http://127.0.0.1:7860), not the webview origin.
 */
function resolveAudioUrl(serverUrl: string): string {
  return serverUrl.startsWith('http') ? serverUrl : `${API_BASE_URL}${serverUrl}`
}

/**
 * Fetch audio from server and create a blob URL for stable client-side playback.
 * Blob URLs are immutable — the audio never changes even if the server file
 * is deleted or the component remounts.  Falls back to the resolved server URL on error.
 * Also caches the blob so AudioPlayer can skip re-fetching the blob URL.
 *
 * In Tauri mode, uses a Rust IPC command to download audio bytes, bypassing
 * WKWebView restrictions that block cross-origin fetch in production macOS builds.
 */
async function toBlobUrl(serverUrl: string): Promise<string> {
  const url = resolveAudioUrl(serverUrl)
  const blob = await fetchAudioBlob(url)
  const blobUrl = URL.createObjectURL(blob)
  audioBlobCache.set(blobUrl, blob)
  return blobUrl
}

interface QueuedGeneration {
  id: string // sound ID
  packId: string
  request: GenerateRequest
  addedAt: number
}

interface GenerationQueueState {
  queue: QueuedGeneration[]
  activeSoundIds: string[]
  maxConcurrency: number
  addToQueue: (item: QueuedGeneration) => void
  removeFromQueue: (soundId: string) => void
  addActive: (soundId: string) => void
  removeActive: (soundId: string) => void
  setMaxConcurrency: (n: number) => void
  clearQueue: () => void
  getQueueLength: () => number
}

export const useGenerationQueueStore = create<GenerationQueueState>((set, get) => ({
  queue: [],
  activeSoundIds: [],
  maxConcurrency: 2,

  addToQueue: (item: QueuedGeneration) =>
    set((state) => ({
      queue: [...state.queue, item]
    })),

  removeFromQueue: (soundId: string) =>
    set((state) => ({
      queue: state.queue.filter((q) => q.id !== soundId)
    })),

  addActive: (soundId: string) =>
    set((state) => ({
      activeSoundIds: [...state.activeSoundIds, soundId]
    })),

  removeActive: (soundId: string) =>
    set((state) => ({
      activeSoundIds: state.activeSoundIds.filter((id) => id !== soundId)
    })),

  setMaxConcurrency: (n: number) => set({ maxConcurrency: n }),

  clearQueue: () => set({ queue: [], activeSoundIds: [] }),

  getQueueLength: () => get().queue.length
}))

export function useGenerationQueue() {
  const queueStore = useGenerationQueueStore()
  const updateSound = useSoundLibrary((s) => s.updateSound)
  const [error, setError] = useState<string | null>(null)
  const abortControllersRef = useRef(new Map<string, AbortController>())
  const processNextRef = useRef<() => void>(() => {})

  // Clean up all abort controllers on unmount
  useEffect(() => {
    const controllers = abortControllersRef.current
    return () => {
      for (const controller of controllers.values()) {
        controller.abort()
      }
      controllers.clear()
    }
  }, [])

  // Process a single queued item (runs independently, multiple can run concurrently)
  const processItem = useCallback(
    async (item: QueuedGeneration) => {
      const { removeFromQueue, removeActive } = useGenerationQueueStore.getState()

      // Ghost guard: skip if sound was already deleted from library while waiting in queue
      const soundStillExists = useSoundLibrary.getState().sounds.some((s) => s.id === item.id)
      if (!soundStillExists) {
        removeFromQueue(item.id)
        removeActive(item.id)
        setTimeout(() => processNextRef.current(), 0)
        return
      }

      // Create abort controller for this item
      const abortController = new AbortController()
      abortControllersRef.current.set(item.id, abortController)
      const signal = abortController.signal

      // Update sound to show it's starting
      updateSound(item.id, {
        status: 'generating',
        stage: 'Starting',
        progress: 0,
        started_at: new Date()
      })

      try {
        // Start generation
        const response = await api.generateAudio(item.request)
        const jobId = response.job_id

        // Check abort after API call returns
        if (signal.aborted) {
          api.deleteAudio(jobId).catch(() => {})
          throw new DOMException('Aborted', 'AbortError')
        }

        // Update sound with job ID
        updateSound(item.id, { job_id: jobId })

        // Set up WebSocket for progress updates (with polling fallback)
        await new Promise<void>((resolve, reject) => {
          let usePolling = false
          let localWs: WebSocket | null = null
          let localPollingInterval: number | null = null

          // Listen for abort signal
          const onAbort = () => {
            if (localWs) {
              localWs.close()
              localWs = null
            }
            if (localPollingInterval) {
              clearInterval(localPollingInterval)
              localPollingInterval = null
            }
            // Best-effort cleanup of backend job
            api.deleteAudio(jobId).catch(() => {})
            reject(new DOMException('Aborted', 'AbortError'))
          }

          if (signal.aborted) {
            onAbort()
            return
          }
          signal.addEventListener('abort', onAbort, { once: true })

          const cleanup = () => {
            signal.removeEventListener('abort', onAbort)
          }

          const connectWebSocket = () => {
            const ws = new WebSocket(`${WS_BASE_URL}/api/ws/${jobId}`)
            localWs = ws
            let completed = false

            // Keep-alive ping
            const pingInterval = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }))
              }
            }, 30000)

            ws.onmessage = async (event) => {
              try {
                const data = JSON.parse(event.data)

                if (data.type === 'pong') return

                if (data.audio_url) {
                  // Completed — create blob URL for stable playback
                  completed = true
                  let audioUrl: string
                  try {
                    // Prefer inline audio_data (base64) from WebSocket — avoids
                    // all HTTP fetch issues in Tauri production builds
                    if (data.audio_data) {
                      const binary = atob(data.audio_data)
                      const bytes = new Uint8Array(binary.length)
                      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                      const blob = new Blob([bytes], { type: 'audio/wav' })
                      audioUrl = URL.createObjectURL(blob)
                      audioBlobCache.set(audioUrl, blob)
                    } else {
                      audioUrl = await toBlobUrl(data.audio_url)
                    }
                  } catch (e) {
                    // Fallback to resolved server URL
                    audioUrl = resolveAudioUrl(data.audio_url)
                    console.error('[queue] blob creation failed, fallback:', e)
                  }
                  updateSound(item.id, {
                    status: 'completed',
                    progress: 1,
                    stage: 'Complete',
                    audio_url: audioUrl,
                    completed_at: new Date()
                  })
                  ws.close()
                  cleanup()
                  resolve()
                  return
                }

                if (data.error) {
                  completed = true
                  updateSound(item.id, {
                    status: 'error',
                    error: data.error,
                    completed_at: new Date()
                  })
                  ws.close()
                  cleanup()
                  reject(new Error(data.error))
                  return
                }

                // Progress update — only for in-flight sounds
                const currentSound = useSoundLibrary
                  .getState()
                  .sounds.find((s) => s.id === item.id)
                if (currentSound?.status === 'completed') return

                const currentProgress = currentSound?.progress ?? 0
                const newProgress = Math.max(data.progress ?? 0, currentProgress)

                updateSound(item.id, {
                  progress: newProgress,
                  stage: data.stage
                })
              } catch {
                // Ignore parse errors
              }
            }

            ws.onerror = () => {
              if (!usePolling && !completed && !signal.aborted) {
                usePolling = true
                ws.close()
                startPolling()
              }
            }

            ws.onclose = () => {
              clearInterval(pingInterval)
              localWs = null
              // If WebSocket closed before completion, switch to polling
              // but not if aborted (abort handler already rejected)
              if (!completed && !usePolling && !signal.aborted) {
                usePolling = true
                startPolling()
              }
            }
          }

          const startPolling = () => {
            const poll = async () => {
              try {
                const status = await api.getAudioStatus(jobId)

                if (status.status === 'completed' && status.audio_url) {
                  // Completed — cache audio as blob URL for stable playback
                  let audioUrl: string
                  try {
                    audioUrl = await toBlobUrl(status.audio_url)
                    console.log(`[queue/poll] toBlobUrl OK: ${audioUrl.slice(0, 60)}`)
                  } catch (e) {
                    // Fallback to resolved server URL (needed in Tauri where relative
                    // URLs resolve against the webview origin, not the backend)
                    audioUrl = resolveAudioUrl(status.audio_url)
                    console.error(`[queue/poll] toBlobUrl failed, fallback to ${audioUrl}:`, e)
                  }
                  updateSound(item.id, {
                    status: 'completed',
                    progress: 1,
                    stage: 'Complete',
                    audio_url: audioUrl,
                    completed_at: new Date()
                  })
                  if (localPollingInterval) {
                    clearInterval(localPollingInterval)
                    localPollingInterval = null
                  }
                  cleanup()
                  resolve()
                } else if (status.status === 'error') {
                  updateSound(item.id, {
                    status: 'error',
                    error: status.error || 'Generation failed',
                    completed_at: new Date()
                  })
                  if (localPollingInterval) {
                    clearInterval(localPollingInterval)
                    localPollingInterval = null
                  }
                  cleanup()
                  reject(new Error(status.error || 'Generation failed'))
                } else {
                  // Progress update — only for in-flight sounds
                  const currentSound = useSoundLibrary
                    .getState()
                    .sounds.find((s) => s.id === item.id)
                  if (currentSound?.status !== 'completed') {
                    const currentProgress = currentSound?.progress ?? 0
                    const newProgress = Math.max(status.progress ?? 0, currentProgress)
                    updateSound(item.id, {
                      progress: newProgress,
                      stage: status.stage || 'Generating'
                    })
                  }
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : ''
                if (msg.includes('not found') || msg.includes('404')) {
                  // Job deleted — terminal error, stop polling
                  if (localPollingInterval) {
                    clearInterval(localPollingInterval)
                    localPollingInterval = null
                  }
                  cleanup()
                  reject(new Error('Job not found'))
                  return
                }
                // Transient network error — continue polling
              }
            }

            poll()
            localPollingInterval = window.setInterval(poll, 2000)
          }

          connectWebSocket()
        })
      } catch (err) {
        // If aborted (sound was deleted), don't set error on the sound
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Sound was deleted — nothing to update
        } else {
          const message = err instanceof Error ? err.message : 'Generation failed'
          setError(message)
          updateSound(item.id, {
            status: 'error',
            error: message,
            completed_at: new Date()
          })
        }
      } finally {
        // Remove from queue and active list
        removeFromQueue(item.id)
        removeActive(item.id)
        abortControllersRef.current.delete(item.id)

        // Fill the freed slot with next queued item
        setTimeout(() => processNextRef.current(), 100)
      }
    },
    [updateSound]
  )

  // Dispatch queued items up to the concurrency limit
  const processNextInQueue = useCallback(() => {
    const { queue, activeSoundIds, maxConcurrency, addActive } =
      useGenerationQueueStore.getState()

    const availableSlots = maxConcurrency - activeSoundIds.length
    if (availableSlots <= 0 || queue.length === 0) return

    // Get queued items that aren't already active
    const pendingItems = queue.filter((q) => !activeSoundIds.includes(q.id))
    const toDispatch = pendingItems.slice(0, availableSlots)

    for (const item of toDispatch) {
      addActive(item.id)
      processItem(item) // fire-and-forget — each manages its own lifecycle
    }
  }, [processItem])

  // Keep ref in sync so processItem's finally block can call the latest version
  useEffect(() => {
    processNextRef.current = processNextInQueue
  }, [processNextInQueue])

  // Start processing when items are added to queue
  useEffect(() => {
    if (queueStore.queue.length > 0) {
      processNextInQueue()
    }
  }, [queueStore.queue.length, processNextInQueue])

  const addToQueue = useCallback(
    (soundId: string, packId: string, request: GenerateRequest) => {
      queueStore.addToQueue({
        id: soundId,
        packId,
        request,
        addedAt: Date.now()
      })
    },
    [queueStore]
  )

  const cancelGeneration = useCallback(
    (soundId: string) => {
      const controller = abortControllersRef.current.get(soundId)
      if (controller) {
        controller.abort()
      }
      queueStore.removeFromQueue(soundId)
    },
    [queueStore]
  )

  const cancelByPackId = useCallback(
    (packId: string) => {
      const { queue } = useGenerationQueueStore.getState()
      // Abort active items belonging to this pack
      for (const item of queue) {
        if (item.packId === packId) {
          const controller = abortControllersRef.current.get(item.id)
          if (controller) {
            controller.abort()
          }
        }
      }
      // Remove all queued items for this pack
      for (const item of queue) {
        if (item.packId === packId) {
          queueStore.removeFromQueue(item.id)
        }
      }
    },
    [queueStore]
  )

  const cancelAll = useCallback(() => {
    // Abort all active generations
    for (const controller of abortControllersRef.current.values()) {
      controller.abort()
    }
    queueStore.clearQueue()
  }, [queueStore])

  return {
    queue: queueStore.queue,
    isProcessing: queueStore.activeSoundIds.length > 0,
    activeSoundIds: queueStore.activeSoundIds,
    queueLength: queueStore.queue.length,
    addToQueue,
    cancelGeneration,
    cancelByPackId,
    cancelAll,
    clearQueue: queueStore.clearQueue,
    error
  }
}
