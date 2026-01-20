import { useCallback, useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { api } from '@/lib/api'
import { useSoundLibrary } from './useSoundLibrary'
import type { GenerateRequest } from '@/types'
import { WS_BASE_URL } from '@/lib/constants'

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
  const { updateSound } = useSoundLibrary()
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const processingRef = useRef(false)
  const pollingRef = useRef<number | null>(null)

  // Clean up WebSocket and polling on unmount
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

      // Update sound with job ID
      updateSound(item.id, { job_id: jobId })

      // Set up WebSocket for progress updates
      await new Promise<void>((resolve, reject) => {
        let usePolling = false

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

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)

              if (data.type === 'pong') return

              updateSound(item.id, {
                progress: data.progress,
                stage: data.stage
              })

              if (data.audio_url) {
                // Completed
                completed = true
                updateSound(item.id, {
                  status: 'completed',
                  progress: 1,
                  stage: 'Complete',
                  audio_url: data.audio_url
                })
                ws.close()
                resolve()
              }

              if (data.error) {
                completed = true
                updateSound(item.id, {
                  status: 'error',
                  error: data.error
                })
                ws.close()
                reject(new Error(data.error))
              }
            } catch {
              // Ignore parse errors
            }
          }

          ws.onerror = () => {
            if (!usePolling && !completed) {
              usePolling = true
              ws.close()
              startPolling()
            }
          }

          ws.onclose = () => {
            clearInterval(pingInterval)
            wsRef.current = null
            // If WebSocket closed before completion, switch to polling
            if (!completed && !usePolling) {
              usePolling = true
              startPolling()
            }
          }
        }

        const startPolling = () => {
          const poll = async () => {
            try {
              const status = await api.getAudioStatus(jobId)

              updateSound(item.id, {
                progress: status.progress,
                stage: status.stage || 'Generating'
              })

              if (status.status === 'completed' && status.audio_url) {
                updateSound(item.id, {
                  status: 'completed',
                  progress: 1,
                  stage: 'Complete',
                  audio_url: status.audio_url
                })
                if (pollingRef.current) {
                  clearInterval(pollingRef.current)
                  pollingRef.current = null
                }
                resolve()
              } else if (status.status === 'error') {
                updateSound(item.id, {
                  status: 'error',
                  error: status.error || 'Generation failed'
                })
                if (pollingRef.current) {
                  clearInterval(pollingRef.current)
                  pollingRef.current = null
                }
                reject(new Error(status.error || 'Generation failed'))
              }
            } catch {
              // Continue polling on network errors
            }
          }

          poll()
          pollingRef.current = window.setInterval(poll, 2000)
        }

        connectWebSocket()
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      setError(message)
      updateSound(item.id, {
        status: 'error',
        error: message
      })
    } finally {
      // Remove from queue and process next
      removeFromQueue(item.id)
      processingRef.current = false
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
      queueStore.removeFromQueue(soundId)
    },
    [queueStore]
  )

  return {
    queue: queueStore.queue,
    isProcessing: queueStore.isProcessing,
    currentSoundId: queueStore.currentSoundId,
    queueLength: queueStore.queue.length,
    addToQueue,
    cancelGeneration,
    clearQueue: queueStore.clearQueue,
    error
  }
}
