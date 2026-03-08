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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/useToast'
import { Save, Eye, EyeOff, Github, RotateCcw, CheckCircle2 } from 'lucide-react'
import type { AppSettings } from '@/hooks/useSettings'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AppSettings
  onSave: (settings: AppSettings) => Promise<void>
}

export function SettingsDialog({ open, onOpenChange, settings, onSave }: SettingsDialogProps) {
  const [githubToken, setGithubToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Sync from props when dialog opens
  useEffect(() => {
    if (open) {
      setGithubToken(settings.github_token || '')
      setShowToken(false)
      setDirty(false)
    }
  }, [open, settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...settings,
        github_token: githubToken.trim() || undefined,
      })
      setDirty(false)
      toast({
        title: 'Settings saved',
        description: githubToken.trim()
          ? 'GitHub token configured. Restart the app to apply.'
          : 'GitHub token cleared. Restart the app to apply.',
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
            Configure credentials for publishing sound packs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* GitHub Token */}
          <div className="space-y-2.5">
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
