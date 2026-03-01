import { useState, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import { Loader2, Github, ExternalLink, CheckCircle2 } from 'lucide-react'
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
  const [packDescription, setPackDescription] = useState('')
  const [packAuthor, setPackAuthor] = useState('ccbell-sound-generator')
  const [packVersion, setPackVersion] = useState('1.0.0')
  const packId = packData ? slugify(packData.packName) : ''

  // Build event mapping from sounds
  const eventMapping = useMemo(() =>
    packData?.sounds.map((sound) => ({
      hookType: sound.hook_type,
      eventName: HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase(),
      filename: `${HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase()}.wav`
    })) ?? []
  , [packData?.sounds])

  const handlePublish = async () => {
    if (!packData || !packId) return

    setIsPublishing(true)
    setReleaseUrl(null)

    try {
      const response = await api.publishRelease({
        pack_id: packId,
        pack_name: packData.packName,
        pack_description: packDescription,
        pack_author: packAuthor,
        pack_version: packVersion,
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
      setPackDescription('')
      setPackAuthor('ccbell-sound-generator')
      setPackVersion('1.0.0')
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Github className="h-5 w-5" />
            Publish Sound Pack
          </DialogTitle>
          <DialogDescription>
            Publish <strong>{packData?.packName}</strong> ({eventMapping.length} sound{eventMapping.length !== 1 ? 's' : ''}) to{' '}
            <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">mpolatcan/ccbell-sound-packs</code>
          </DialogDescription>
        </DialogHeader>

        {releaseUrl ? (
          <div className="py-8 text-center animate-fade-in">
            <div className="mb-4">
              <CheckCircle2 className="h-14 w-14 mx-auto text-green-500" />
            </div>
            <h3 className="text-lg font-display font-semibold mb-2">Pack Published!</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Install with:
            </p>
            <code className="inline-block bg-muted/60 px-3 py-1.5 rounded-lg text-xs font-mono border border-border/30 mb-4">
              ccbell packs install {packId}
            </code>
            <div>
              <Button asChild>
                <a href={releaseUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Release
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Pack Metadata */}
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="publish-author" className="text-xs text-muted-foreground">Author</Label>
                  <Input
                    id="publish-author"
                    value={packAuthor}
                    onChange={(e) => setPackAuthor(e.target.value)}
                    placeholder="ccbell-sound-generator"
                    className="placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="publish-version" className="text-xs text-muted-foreground">Version</Label>
                  <Input
                    id="publish-version"
                    value={packVersion}
                    onChange={(e) => setPackVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="font-mono placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish-description" className="text-xs text-muted-foreground">Description</Label>
                <Input
                  id="publish-description"
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  placeholder="AI-generated notification sounds for Claude Code"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Event Mapping Preview */}
            {eventMapping.length > 0 && (
              <div className="space-y-2 py-4">
                <Separator className="opacity-50" />
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    <span>Hook Type</span>
                    <span>Event Name</span>
                    <span>Filename</span>
                  </div>
                  {eventMapping.map((mapping) => (
                    <div
                      key={mapping.hookType}
                      className="grid grid-cols-3 gap-2 p-2 border-t border-border/30 text-sm"
                    >
                      <span className="text-xs">{mapping.hookType}</span>
                      <Badge variant="secondary" className="w-fit text-[10px] font-mono">
                        {mapping.eventName}
                      </Badge>
                      <span className="text-muted-foreground text-[10px] font-mono">
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
