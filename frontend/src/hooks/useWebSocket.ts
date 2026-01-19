import { useCallback, useEffect, useRef, useState } from 'react'
import { WS_BASE_URL } from '@/lib/constants'
import type { ProgressUpdate } from '@/types'

interface UseWebSocketOptions {
  onProgress?: (update: ProgressUpdate) => void
  onComplete?: (audioUrl: string) => void
  onError?: (error: string) => void
}

export function useWebSocket(jobId: string | null, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pingIntervalRef = useRef<number | null>(null)

  const connect = useCallback(() => {
    if (!jobId) return

    const wsUrl = `${WS_BASE_URL}/api/ws/${jobId}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // Start ping interval to keep connection alive
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)
    }

    ws.onmessage = (event) => {
      try {
        // Handle pong responses
        if (event.data === 'pong') return

        const data: ProgressUpdate = JSON.parse(event.data)

        options.onProgress?.(data)

        if (data.stage === 'completed' && data.audio_url) {
          options.onComplete?.(data.audio_url)
        }

        if (data.error) {
          options.onError?.(data.error)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      options.onError?.('WebSocket connection error')
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }
    }
  }, [jobId, options])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Connect when jobId changes
  useEffect(() => {
    if (jobId) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [jobId, connect, disconnect])

  return {
    isConnected,
    connect,
    disconnect
  }
}
