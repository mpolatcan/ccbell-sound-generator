import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw } from 'lucide-react'
import { formatDuration, downloadUrl, cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  filename?: string
  className?: string
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function AudioPlayer({
  audioUrl,
  filename = 'sound.wav',
  className,
  onPlayStateChange
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(var(--muted-foreground) / 0.3)',
      progressColor: 'hsl(var(--primary))',
      cursorColor: 'hsl(var(--primary))',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
    })

    wavesurfer.load(audioUrl)

    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration())
      setIsReady(true)
      wavesurfer.setVolume(volume)
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

    return () => {
      wavesurfer.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl])

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

  const handleDownload = useCallback(async () => {
    await downloadUrl(audioUrl, filename)
  }, [audioUrl, filename])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Waveform */}
      <div
        ref={containerRef}
        className="w-full rounded-md bg-muted/30 p-2"
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          disabled={!isReady}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Restart */}
        <Button
          variant="ghost"
          size="icon"
          onClick={restart}
          disabled={!isReady}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Time */}
        <span className="text-sm text-muted-foreground min-w-[80px]">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            className="w-24"
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={1}
            step={0.01}
          />
        </div>

        {/* Download */}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  )
}
