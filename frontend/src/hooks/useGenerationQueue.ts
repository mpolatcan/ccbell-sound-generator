import { useCallback, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { useSoundLibrary } from './useSoundLibrary'
import type { GenerateRequest } from '@/types'
import { WS_BASE_URL } from '@/lib/constants'

/**
 * Fetch audio from server and create a blob URL for stable client-side playback.
 * Blob URLs are immutable — the audio never changes even if the server file
 * is deleted or the component remounts.  Falls back to the server URL on error.
 */
async function toBlobUrl(serverUrl: string): Promise<string> {
  const res = await fetch(serverUrl)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

interface QueuedGeneration {
  id: string // sound ID
  packId: string
  request: GenerateRequest
  addedAt: number
}

interface GenerationQueueState {
  queue: QueuedGeneration[]
  isProcessing: boolean
  currentSoundId: string | null
  addToQueue: (item: QueuedGeneration) => void
  removeFromQueue: (soundId: string) => void
  setProcessing: (isProcessing: boolean, soundId?: string | null) => void
  clearQueue: () => void
  getQueueLength: () => number
}

export const useGenerationQueueStore = create<GenerationQueueState>((set, get) => ({
  queue: [],
  isProcessing: false,
  currentSoundId: null,

  addToQueue: (item: QueuedGeneration) =>
    set((state) => ({
      queue: [...state.queue, item]
    })),

  removeFromQueue: (soundId: string) =>
    set((state) => ({
      queue: state.queue.filter((q) => q.id !== soundId)
    })),

  setProcessing: (isProcessing: boolean, soundId: string | null = null) =>
    set({ isProcessing, currentSoundId: soundId }),

  clearQueue: () => set({ queue: [], isProcessing: false, currentSoundId: null }),

  getQueueLength: () => get().queue.length
}))

export function useGenerationQueue() {
  const queueStore = useGenerationQueueStore()
  const updateSound = useSoundLibrary((s) => s.updateSound)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const processingRef = useRef(false)
  const pollingRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Clean up WebSocket, polling, and abort controller on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const processNextInQueue = useCallback(async () => {
    const { queue, setProcessing, removeFromQueue } = useGenerationQueueStore.getState()

    // Prevent concurrent processing
    if (processingRef.current || queue.length === 0) {
      return
    }

    processingRef.current = true
    const item = queue[0]

    // Ghost guard: skip if sound was already deleted from library while waiting in queue
    const soundStillExists = useSoundLibrary.getState().sounds.some((s) => s.id === item.id)
    if (!soundStillExists) {
      removeFromQueue(item.id)
      processingRef.current = false
      setTimeout(() => processNextInQueue(), 0)
      return
    }

    // Create abort controller for this processing cycle
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    const signal = abortController.signal

    setProcessing(true, item.id)

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
        // Best-effort cleanup of the backend job we just created
        api.deleteAudio(jobId).catch(() => {})
        throw new DOMException('Aborted', 'AbortError')
      }

      // Update sound with job ID
      updateSound(item.id, { job_id: jobId })

      // Set up WebSocket for progress updates
      await new Promise<void>((resolve, reject) => {
        let usePolling = false

        // Listen for abort signal
        const onAbort = () => {
          if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
          }
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
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
          wsRef.current = ws
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
                // Completed — cache audio as blob URL for stable playback
                completed = true
                let audioUrl = data.audio_url
                try {
                  audioUrl = await toBlobUrl(data.audio_url)
                } catch {
                  // Fallback to server URL
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
              const currentSound = useSoundLibrary.getState().sounds.find((s) => s.id === item.id)
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
            wsRef.current = null
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
                let audioUrl = status.audio_url
                try {
                  audioUrl = await toBlobUrl(status.audio_url)
                } catch {
                  // Fallback to server URL
                }
                updateSound(item.id, {
                  status: 'completed',
                  progress: 1,
                  stage: 'Complete',
                  audio_url: audioUrl,
                  completed_at: new Date()
                })
                if (pollingRef.current) {
                  clearInterval(pollingRef.current)
                  pollingRef.current = null
                }
                cleanup()
                resolve()
              } else if (status.status === 'error') {
                updateSound(item.id, {
                  status: 'error',
                  error: status.error || 'Generation failed',
                  completed_at: new Date()
                })
                if (pollingRef.current) {
                  clearInterval(pollingRef.current)
                  pollingRef.current = null
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
                if (pollingRef.current) {
                  clearInterval(pollingRef.current)
                  pollingRef.current = null
                }
                cleanup()
                reject(new Error('Job not found'))
                return
              }
              // Transient network error — continue polling
            }
          }

          poll()
          pollingRef.current = window.setInterval(poll, 2000)
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
      // Remove from queue and process next
      removeFromQueue(item.id)
      processingRef.current = false
      abortControllerRef.current = null
      setProcessing(false, null)

      // Process next item if available
      setTimeout(() => {
        processNextInQueue()
      }, 500)
    }
  }, [updateSound])

  // Start processing when items are added to queue
  useEffect(() => {
    if (queueStore.queue.length > 0 && !processingRef.current) {
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
      const { currentSoundId } = useGenerationQueueStore.getState()
      if (currentSoundId === soundId && abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      queueStore.removeFromQueue(soundId)
    },
    [queueStore]
  )

  const cancelByPackId = useCallback(
    (packId: string) => {
      const { queue, currentSoundId } = useGenerationQueueStore.getState()
      // Abort active item if it belongs to this pack
      const activeItem = queue.find((q) => q.id === currentSoundId)
      if (activeItem && activeItem.packId === packId && abortControllerRef.current) {
        abortControllerRef.current.abort()
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    queueStore.clearQueue()
  }, [queueStore])

  return {
    queue: queueStore.queue,
    isProcessing: queueStore.isProcessing,
    currentSoundId: queueStore.currentSoundId,
    queueLength: queueStore.queue.length,
    addToQueue,
    cancelGeneration,
    cancelByPackId,
    cancelAll,
    clearQueue: queueStore.clearQueue,
    error
  }
}
