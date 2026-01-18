import { useState, useCallback } from 'react'
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
      stage: 'complete'
    }))
  }, [])

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      stage: 'error',
      error
    }))
  }, [])

  // WebSocket connection for progress updates
  useWebSocket(state.currentJobId, {
    onProgress: handleProgress,
    onComplete: handleComplete,
    onError: handleError
  })

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
  }, [])

  return {
    ...state,
    completedAudioUrl,
    generate,
    reset
  }
}
