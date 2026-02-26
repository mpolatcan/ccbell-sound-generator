import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import { Loader2, Github, ExternalLink } from 'lucide-react'
import type { PublishPackData } from '@/types'
import { HOOK_TO_EVENT_MAP } from '@/types'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packData: PublishPackData | null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function PublishDialog({ open, onOpenChange, packData }: PublishDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null)
  const [packId, setPackId] = useState('')

  // Derive pack ID when packData changes
  useEffect(() => {
    if (packData) {
      setPackId(slugify(packData.packName))
    }
  }, [packData])

  // Build event mapping from sounds
  const eventMapping = packData?.sounds.map((sound) => ({
    hookType: sound.hook_type,
    eventName: HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase(),
    filename: `${HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase()}.wav`
  })) ?? []

  const handlePublish = async () => {
    if (!packData || !packId) return

    setIsPublishing(true)
    setReleaseUrl(null)

    try {
      const response = await api.publishRelease({
        pack_id: packId,
        pack_name: packData.packName,
        pack_description: '',
        pack_author: 'ccbell-sound-generator',
        pack_version: '1.0.0',
        sound_files: packData.sounds.map((s) => s.job_id)
      })

      if (response.success && response.release_url) {
        setReleaseUrl(response.release_url)
        toast({
          title: 'Published successfully!',
          description: 'Your sound pack has been published to GitHub.'
        })
      } else {
        throw new Error(response.error || 'Publishing failed')
      }
    } catch (error) {
      toast({
        title: 'Publishing failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setReleaseUrl(null)
      setPackId('')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Publish Sound Pack
          </DialogTitle>
          <DialogDescription>
            Publish <strong>{packData?.packName}</strong> ({eventMapping.length} sound{eventMapping.length !== 1 ? 's' : ''}) to{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">mpolatcan/ccbell-sound-packs</code>
          </DialogDescription>
        </DialogHeader>

        {releaseUrl ? (
          <div className="py-6 text-center">
            <div className="mb-4 text-green-600">
              <svg
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">Pack Published!</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Install with: <code className="bg-muted px-1 py-0.5 rounded text-xs">ccbell packs install {packId}</code>
            </p>
            <Button asChild>
              <a href={releaseUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Release
              </a>
            </Button>
          </div>
        ) : (
          <div>
            {/* Event Mapping Preview */}
            {eventMapping.length > 0 && (
              <div className="space-y-2 py-4">
                <Separator />
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Hook Type</span>
                    <span>Event Name</span>
                    <span>Filename</span>
                  </div>
                  {eventMapping.map((mapping) => (
                    <div
                      key={mapping.hookType}
                      className="grid grid-cols-3 gap-2 p-2 border-t text-sm"
                    >
                      <span>{mapping.hookType}</span>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {mapping.eventName}
                      </Badge>
                      <span className="text-muted-foreground text-xs font-mono">
                        {mapping.filename}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handlePublish} disabled={isPublishing}>
                {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
