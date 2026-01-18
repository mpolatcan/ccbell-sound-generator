import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AudioPlayer } from './AudioPlayer'
import { Trash2, Archive } from 'lucide-react'
import { formatDuration, downloadUrl } from '@/lib/utils'

interface SoundLibraryProps {
  onSelectForPublish?: (soundIds: string[]) => void
}

export function SoundLibrary({ onSelectForPublish }: SoundLibraryProps) {
  const { sounds, removeSound, clearSounds } = useSoundLibrary()

  const handleDownloadAll = async () => {
    // Download each sound individually
    for (const sound of sounds) {
      await downloadUrl(sound.audio_url, `${sound.hook_type.toLowerCase()}.wav`)
    }
  }

  const handlePublishAll = () => {
    onSelectForPublish?.(sounds.map(s => s.job_id))
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
          <Button variant="outline" size="sm" onClick={handleDownloadAll}>
            <Archive className="h-4 w-4 mr-2" />
            Download All
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
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{sound.hook_type}</h4>
                        <Badge variant="secondary">{sound.model}</Badge>
                        <Badge variant="outline">
                          {formatDuration(sound.duration)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {sound.prompt}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSound(sound.id)}
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
