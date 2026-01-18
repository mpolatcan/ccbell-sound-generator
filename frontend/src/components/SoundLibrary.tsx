import { useRef, useState } from 'react'
import JSZip from 'jszip'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AudioPlayer } from './AudioPlayer'
import { Trash2, Archive, Loader2, Volume2 } from 'lucide-react'
import { formatDuration, downloadBlob } from '@/lib/utils'

interface SoundLibraryProps {
  onSelectForPublish?: (soundIds: string[]) => void
}

export function SoundLibrary({ onSelectForPublish }: SoundLibraryProps) {
  const { sounds, removeSound, clearSounds } = useSoundLibrary()
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewingSoundId, setPreviewingSoundId] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleDownloadAll = async () => {
    if (sounds.length === 0) return

    setIsDownloading(true)
    try {
      const zip = new JSZip()

      // Fetch all audio files and add to ZIP
      await Promise.all(
        sounds.map(async (sound) => {
          const response = await fetch(sound.audio_url)
          const blob = await response.blob()
          zip.file(`${sound.hook_type.toLowerCase()}.wav`, blob)
        })
      )

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(zipBlob, 'ccbell-sounds.zip')
    } catch (error) {
      console.error('Failed to create ZIP:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePublishAll = () => {
    onSelectForPublish?.(sounds.map(s => s.job_id))
  }

  const handlePreviewStart = (sound: { id: string; audio_url: string }) => {
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    // Create and play new audio preview
    const audio = new Audio(sound.audio_url)
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore autoplay errors
    })
    previewAudioRef.current = audio
    setPreviewingSoundId(sound.id)

    // Stop preview when audio ends
    audio.onended = () => {
      setPreviewingSoundId(null)
      previewAudioRef.current = null
    }
  }

  const handlePreviewStop = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }
    setPreviewingSoundId(null)
  }

  if (sounds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sound Library</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Generated sounds will appear here. Start by creating your first sound!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Sound Library</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Download ZIP
          </Button>
          {onSelectForPublish && (
            <Button variant="default" size="sm" onClick={handlePublishAll}>
              Publish to GitHub
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearSounds}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {sounds.map((sound, index) => (
              <div key={sound.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div
                    className="flex items-start justify-between cursor-pointer group"
                    onMouseEnter={() => handlePreviewStart(sound)}
                    onMouseLeave={handlePreviewStop}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{sound.hook_type}</h4>
                        <Badge variant="secondary">{sound.model}</Badge>
                        <Badge variant="outline">
                          {formatDuration(sound.duration)}
                        </Badge>
                        {previewingSoundId === sound.id && (
                          <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {sound.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Hover to preview
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSound(sound.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <AudioPlayer
                    audioUrl={sound.audio_url}
                    filename={`${sound.hook_type.toLowerCase()}.wav`}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
