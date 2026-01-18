import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { ModelLoadingStatus, ModelLoadingStatusType } from '@/types'

interface UseModelStatusOptions {
  modelId: string
  pollInterval?: number
  autoLoad?: boolean
}

interface UseModelStatusReturn {
  status: ModelLoadingStatusType
  progress: number
  stage: string | null
  error: string | null
  isReady: boolean
  isLoading: boolean
  isError: boolean
  loadModel: () => Promise<void>
  refetch: () => Promise<ModelLoadingStatus | null>
}

export function useModelStatus({
  modelId,
  pollInterval = 2000,
  autoLoad = true
}: UseModelStatusOptions): UseModelStatusReturn {
  const [statusData, setStatusData] = useState<ModelLoadingStatus>({
    model_id: modelId,
    status: 'idle',
    progress: 0,
    stage: null,
    error: null
  })

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getModelStatus(modelId)
      setStatusData(data)
      return data
    } catch (error) {
      console.error('Failed to fetch model status:', error)
      return null
    }
  }, [modelId])

  const loadModel = useCallback(async () => {
    try {
      await api.loadModel(modelId)
      // Immediately fetch status after triggering load
      await fetchStatus()
    } catch (error) {
      console.error('Failed to trigger model loading:', error)
    }
  }, [modelId, fetchStatus])

  // Initial fetch and auto-load
  useEffect(() => {
    const init = async () => {
      const data = await fetchStatus()
      // Auto-load if idle and autoLoad is enabled
      if (autoLoad && data?.status === 'idle') {
        await loadModel()
      }
    }
    init()
  }, [modelId, autoLoad, fetchStatus, loadModel])

  // Poll while loading
  useEffect(() => {
    if (statusData.status !== 'loading') {
      return
    }

    const interval = setInterval(fetchStatus, pollInterval)
    return () => clearInterval(interval)
  }, [statusData.status, pollInterval, fetchStatus])

  return {
    status: statusData.status,
    progress: statusData.progress,
    stage: statusData.stage,
    error: statusData.error,
    isReady: statusData.status === 'ready',
    isLoading: statusData.status === 'loading',
    isError: statusData.status === 'error',
    loadModel,
    refetch: fetchStatus
  }
}
