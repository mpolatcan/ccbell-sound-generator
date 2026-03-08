import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import { Loader2, Download, Copy, Check, Package } from 'lucide-react'
import type { DownloadPackData } from '@/types'
import { HOOK_TO_EVENT_MAP } from '@/types'

interface DownloadPackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packData: DownloadPackData | null
}

export function DownloadPackDialog({ open, onOpenChange, packData }: DownloadPackDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [packId, setPackId] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [installCommand, setInstallCommand] = useState<string | null>(null)
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const eventMapping = useMemo(() =>
    packData?.sounds.map((sound) => ({
      hookType: sound.hook_type,
      eventName: HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase(),
      filename: `${HOOK_TO_EVENT_MAP[sound.hook_type] || sound.hook_type.toLowerCase()}.wav`
    })) ?? []
  , [packData?.sounds])

  // Auto-create pack when dialog opens
  useEffect(() => {
    if (!open || !packData || packData.sounds.length === 0) return

    let cancelled = false

    const createPack = async () => {
      setIsCreating(true)
      setError(null)
      setPackId(null)
      setDownloadUrl(null)
      setInstallCommand(null)
      setExpiresInSeconds(0)

      try {
        const response = await api.createPack({
          pack_name: packData.packName,
          pack_description: 'AI-generated notification sounds for Claude Code',
          sound_files: packData.sounds.map((s) => s.job_id)
        })

        if (cancelled) return

        if (response.success && response.pack_id) {
          setPackId(response.pack_id)
          // Resolve {base_url} placeholder with actual origin
          const baseUrl = window.location.origin
          setDownloadUrl(
            response.download_url?.replace('{base_url}', baseUrl) ?? null
          )
          setInstallCommand(
            response.install_command?.replace('{base_url}', baseUrl) ?? null
          )
          setExpiresInSeconds(response.expires_in_seconds ?? 0)
        } else {
          setError(response.error || 'Failed to create pack')
        }
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Unknown error'
        setError(msg)
      } finally {
        if (!cancelled) setIsCreating(false)
      }
    }

    createPack()
    return () => { cancelled = true }
  }, [open, packData])

  const handleCopyCommand = async () => {
    if (!installCommand) return
    try {
      await navigator.clipboard.writeText(installCommand)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Install command copied to clipboard.'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setPackId(null)
      setDownloadUrl(null)
      setInstallCommand(null)
      setExpiresInSeconds(0)
      setError(null)
      setCopied(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Package className="h-5 w-5 text-primary" />
            Install Sound Pack
          </DialogTitle>
          <DialogDescription>
            Install <strong>{packData?.packName}</strong> ({eventMapping.length} sound{eventMapping.length !== 1 ? 's' : ''}) to your ccbell plugin
          </DialogDescription>
        </DialogHeader>

        {isCreating ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Creating pack...</p>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </div>
        ) : packId ? (
          <div className="space-y-4">
            {/* Install Command */}
            <div className="space-y-2">
              <label htmlFor="install-command" className="text-sm font-medium">Install in Claude Code</label>
              <div className="flex gap-2">
                <code id="install-command" className="flex-1 bg-muted/60 px-3 py-2 rounded-lg text-xs font-mono break-all border border-border/30">
                  {installCommand}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCommand}
                  className="shrink-0"
                  aria-label="Copy install command"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Direct Download */}
            <div>
              <Button asChild variant="outline" className="w-full">
                <a href={downloadUrl ?? '#'} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download ZIP
                </a>
              </Button>
            </div>

            {/* Event Mapping */}
            {eventMapping.length > 0 && (
              <div className="space-y-2">
                <Separator className="opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">Pack Contents</p>
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

            {expiresInSeconds > 0 && (
              <p className="text-[10px] text-muted-foreground/60 text-center">
                Pack link expires in {Math.round(expiresInSeconds / 60)} minutes
              </p>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
