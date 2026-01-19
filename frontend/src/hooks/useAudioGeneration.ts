import { useState, useCallback, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useWebSocket } from './useWebSocket'
import type { GenerateRequest, GenerationState, GenerationStage } from '@/types'

export function useAudioGeneration() {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    stage: 'idle',
    currentJobId: null,
    error: null
  })
  const [completedAudioUrl, setCompletedAudioUrl] = useState<string | null>(null)
  const [usePolling, setUsePolling] = useState(false)
  const pollingIntervalRef = useRef<number | null>(null)

  const handleProgress = useCallback((update: { progress: number; stage: string }) => {
    setState(prev => ({
      ...prev,
      progress: update.progress,
      stage: update.stage as GenerationStage
    }))
  }, [])

  const handleComplete = useCallback((audioUrl: string) => {
    setCompletedAudioUrl(audioUrl)
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 1,
      stage: 'completed'
    }))
    // Stop polling if active
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const handleError = useCallback((error: string) => {
    // If WebSocket fails, switch to polling
    if (error === 'WebSocket connection error') {
      console.log('WebSocket failed, switching to polling')
      setUsePolling(true)
      return // Don't set error state, let polling take over
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      stage: 'error',
      error
    }))
    // Stop polling if active
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // WebSocket connection for progress updates
  useWebSocket(state.currentJobId, {
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError
  })

  // Polling fallback for WebSocket failures
  useEffect(() => {
    if (!usePolling || !state.currentJobId || !state.isGenerating) {
      return
    }

    const pollStatus = async () => {
      try {
        const status = await api.getAudioStatus(state.currentJobId!)

        handleProgress({ progress: status.progress, stage: status.stage || 'generating' })

        if (status.status === 'completed' && status.audio_url) {
          handleComplete(status.audio_url)
          setUsePolling(false)
        } else if (status.status === 'error') {
          handleError(status.error || 'Generation failed')
          setUsePolling(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        // Continue polling on network errors
      }
    }

    // Start polling immediately
    pollStatus()

    // Then poll every 2 seconds
    pollingIntervalRef.current = window.setInterval(pollStatus, 2000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [usePolling, state.currentJobId, state.isGenerating, handleProgress, handleComplete, handleError])

  const generate = useCallback(async (request: GenerateRequest) => {
    try {
      // Reset state
      setState({
        isGenerating: true,
        progress: 0,
        stage: 'idle',
        currentJobId: null,
        error: null
      })
      setCompletedAudioUrl(null)
      setUsePolling(false)

      // Start generation
      const response = await api.generateAudio(request)

      // Update state with job ID to connect WebSocket
      setState(prev => ({
        ...prev,
        currentJobId: response.job_id
      }))

      return response.job_id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed'
      handleError(message)
      throw error
    }
  }, [handleError])

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      stage: 'idle',
      currentJobId: null,
      error: null
    })
    setCompletedAudioUrl(null)
    setUsePolling(false)
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  return {
    ...state,
    completedAudioUrl,
    generate,
    reset
  }
}
