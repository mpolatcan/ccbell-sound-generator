import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface ElapsedTimeProps {
  startTime: Date | undefined
  isRunning: boolean
}

export function ElapsedTime({ startTime, isRunning }: ElapsedTimeProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startTime || !isRunning) {
      return
    }

    const calculateElapsed = () => {
      const start = startTime instanceof Date ? startTime : new Date(startTime)
      const now = new Date()
      return Math.floor((now.getTime() - start.getTime()) / 1000)
    }

    // Initial calculation
    setElapsed(calculateElapsed())

    // Update every second
    const interval = setInterval(() => {
      setElapsed(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, isRunning])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!startTime || !isRunning) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      {formatTime(elapsed)}
    </span>
  )
}
