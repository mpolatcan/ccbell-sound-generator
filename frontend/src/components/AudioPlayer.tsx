import { useEffect, useRef, useState, useCallback, memo } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Volume2, VolumeX, RotateCcw, AlertCircle, RefreshCw } from 'lucide-react'
import { formatDuration, cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  className?: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

const MAX_AUTO_RETRIES = 2
const RETRY_DELAY_MS = 1500

export const AudioPlayer = memo(function AudioPlayer({
  audioUrl,
  className,
  onPlayStateChange
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const autoRetryCount = useRef(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const createWaveSurfer = useCallback(() => {
    if (!containerRef.current) return

    // Destroy existing instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy()
      wavesurferRef.current = null
    }

    setIsLoading(true)
    setHasError(false)
    setIsReady(false)

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(24 5% 30%)',
      progressColor: 'hsl(30 85% 54%)',
      cursorColor: 'hsl(30 85% 60%)',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 56,
      normalize: true,
    })

    wavesurfer.load(audioUrl)

    wavesurfer.on('ready', () => {
      autoRetryCount.current = 0
      setDuration(wavesurfer.getDuration())
      setIsReady(true)
      setIsLoading(false)
      wavesurfer.setVolume(volume)
    })

    wavesurfer.on('error', () => {
      // Auto-retry a few times before showing error
      if (autoRetryCount.current < MAX_AUTO_RETRIES) {
        autoRetryCount.current++
        setTimeout(() => createWaveSurfer(), RETRY_DELAY_MS)
        return
      }
      setHasError(true)
      setIsLoading(false)
    })

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime())
    })

    wavesurfer.on('play', () => {
      setIsPlaying(true)
      onPlayStateChange?.(true)
    })

    wavesurfer.on('pause', () => {
      setIsPlaying(false)
      onPlayStateChange?.(false)
    })

    wavesurfer.on('finish', () => {
      setIsPlaying(false)
      onPlayStateChange?.(false)
    })

    wavesurferRef.current = wavesurfer
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

  // Initialize WaveSurfer
  useEffect(() => {
    autoRetryCount.current = 0
    createWaveSurfer()

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
  }, [createWaveSurfer])

  // Update volume when it changes
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.setVolume(isMuted ? 0 : volume)
    }
  }, [volume, isMuted, isReady])

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  const restart = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(0)
      wavesurferRef.current.play()
    }
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
    setIsMuted(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const handleRetry = useCallback(() => {
    autoRetryCount.current = 0
    createWaveSurfer()
  }, [createWaveSurfer])

  return (
    <div className={cn('space-y-2', className)}>
      {/* Waveform - always mounted so retry works */}
      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            'w-full rounded-lg bg-muted/20 p-2 border border-border/30 transition-opacity duration-300',
            (isLoading || hasError) && 'opacity-0 h-0 overflow-hidden p-0 border-0'
          )}
        />
        {isLoading && (
          <div className="flex items-center justify-center h-[56px] rounded-lg bg-muted/20 border border-border/30">
            <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-primary/50 rounded-full animate-shimmer" />
            </div>
          </div>
        )}
        {hasError && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive/80 flex-1">Failed to load audio</p>
            <Button variant="ghost" size="sm" onClick={handleRetry} className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Controls - only show when ready */}
      {isReady && (
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-border/50"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </Button>

          {/* Restart */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={restart}
            aria-label="Restart audio"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          {/* Time */}
          <span className="text-xs font-mono text-muted-foreground min-w-[72px] tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          {/* Volume */}
          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Slider
              className="w-20"
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.01}
            />
          </div>
        </div>
      )}
    </div>
  )
})
