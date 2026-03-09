import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import { Save, Eye, EyeOff, Github, RotateCcw, CheckCircle2, Trash2, Loader2, Layers } from 'lucide-react'
import type { AppSettings } from '@/hooks/useSettings'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AppSettings
  onSave: (settings: AppSettings) => Promise<void>
  isDesktop: boolean
  maxConcurrentGenerations: number
  onMaxConcurrentGenerationsChange: (value: number) => void
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
  isDesktop,
  maxConcurrentGenerations,
  onMaxConcurrentGenerationsChange,
}: SettingsDialogProps) {
  const [githubToken, setGithubToken] = useState('')
  const [concurrency, setConcurrency] = useState(2)
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [uninstalling, setUninstalling] = useState(false)

  // Sync from props when dialog opens
  useEffect(() => {
    if (open) {
      setGithubToken(settings.github_token || '')
      setConcurrency(maxConcurrentGenerations)
      setShowToken(false)
      setDirty(false)
    }
  }, [open, settings, maxConcurrentGenerations])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update concurrency via backend API (immediate, no restart needed)
      if (concurrency !== maxConcurrentGenerations) {
        await api.updateConfig({ max_concurrent_generations: concurrency })
        onMaxConcurrentGenerationsChange(concurrency)
      }

      // Persist settings (desktop: saves to disk, web: no-op)
      if (isDesktop) {
        await onSave({
          ...settings,
          github_token: githubToken.trim() || undefined,
          max_concurrent_generations: concurrency,
        })
      }

      setDirty(false)
      toast({
        title: 'Settings saved',
        description: 'Changes applied immediately.',
      })
      onOpenChange(false)
    } catch {
      toast({
        title: 'Failed to save settings',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUninstall = async () => {
    setUninstalling(true)
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<{ success: boolean; removed: string[] }>('uninstall_cleanup')

      if (result.success) {
        toast({
          title: 'Cleanup complete',
          description: `Removed ${result.removed.length} item(s). You can now delete the app.`,
        })

        // Close the app after a short delay so the user sees the toast
        setTimeout(async () => {
          try {
            const { getCurrentWindow } = await import('@tauri-apps/api/window')
            await getCurrentWindow().close()
          } catch {
            // Fallback: just close the dialog
            onOpenChange(false)
          }
        }, 2000)
      }
    } catch (err) {
      toast({
        title: 'Uninstall failed',
        description: String(err),
        variant: 'destructive',
      })
      setUninstalling(false)
    }
  }

  const handleClear = () => {
    setGithubToken('')
    setDirty(true)
  }

  const hasToken = Boolean(githubToken.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure generation and app settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Max Parallel Generations */}
          <div className="space-y-2.5">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-4 w-4" />
              Max Parallel Generations
            </Label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Number of sounds generated simultaneously.
              Higher values use more memory and CPU.
            </p>
            <div className="flex items-center gap-3">
              <Slider
                value={[concurrency]}
                onValueChange={([v]) => { setConcurrency(v); setDirty(true) }}
                min={1}
                max={4}
                step={1}
                className="flex-1"
              />
              <Badge variant="secondary" className="font-mono tabular-nums shrink-0 min-w-[2rem] justify-center">
                {concurrency}
              </Badge>
            </div>
          </div>

          {/* GitHub Token (desktop only) */}
          {isDesktop && (
            <div className="space-y-2.5 border-t pt-5">
              <Label htmlFor="github-token" className="flex items-center gap-2 text-sm font-medium">
                <Github className="h-4 w-4" />
                GitHub Personal Access Token
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Required to publish sound packs to the{' '}
                <span className="font-mono text-foreground/70">ccbell-sound-packs</span>{' '}
                repository. Needs <span className="font-mono text-foreground/70">repo</span> scope.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="github-token"
                    type={showToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => {
                      setGithubToken(e.target.value)
                      setDirty(true)
                    }}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="pr-10 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowToken(!showToken)}
                    tabIndex={-1}
                  >
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                {hasToken && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleClear}
                    title="Clear token"
                    className="shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              {hasToken && !dirty && (
                <p className="text-xs text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Token configured
                </p>
              )}
            </div>
          )}

          {/* Uninstall (desktop only) */}
          {isDesktop && (
            <div className="space-y-2.5 border-t pt-5">
              <Label className="flex items-center gap-2 text-sm font-medium text-destructive">
                <Trash2 className="h-4 w-4" />
                Uninstall
              </Label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Remove all app data including the Python environment, cached model weights,
                and settings. The app will close after cleanup.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={uninstalling}>
                    {uninstalling ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Removing data...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Trash2 className="h-3.5 w-3.5" />
                        Uninstall App Data
                      </span>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">This will permanently remove:</span>
                      <span className="block text-xs font-mono bg-muted p-2 rounded space-y-0.5">
                        <span className="block">Python virtual environment (~1-2 GB)</span>
                        <span className="block">Cached model weights (~1.5 GB)</span>
                        <span className="block">App settings and preferences</span>
                      </span>
                      <span className="block">
                        The app will close after cleanup. You can then drag it to the Trash
                        to complete the uninstall.
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleUninstall}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Uninstall
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? (
              <span className="flex items-center gap-1.5">Saving...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Save
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
