import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { toast } from '@/hooks/useToast'
import { Loader2, Github, ExternalLink } from 'lucide-react'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  soundIds: string[]
}

export function PublishDialog({ open, onOpenChange, soundIds }: PublishDialogProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [releaseUrl, setReleaseUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    githubToken: '',
    repoOwner: '',
    repoName: '',
    releaseTag: '',
    releaseName: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.githubToken || !formData.repoOwner || !formData.repoName ||
        !formData.releaseTag || !formData.releaseName) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      })
      return
    }

    setIsPublishing(true)
    setReleaseUrl(null)

    try {
      const response = await api.publishRelease({
        github_token: formData.githubToken,
        repo_owner: formData.repoOwner,
        repo_name: formData.repoName,
        release_tag: formData.releaseTag,
        release_name: formData.releaseName,
        sound_files: soundIds,
        description: formData.description || undefined
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
    // Reset form after closing
    setTimeout(() => {
      setFormData({
        githubToken: '',
        repoOwner: '',
        repoName: '',
        releaseTag: '',
        releaseName: '',
        description: ''
      })
      setReleaseUrl(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Publish to GitHub Release
          </DialogTitle>
          <DialogDescription>
            Create a GitHub release with your {soundIds.length} generated sound{soundIds.length !== 1 ? 's' : ''}.
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
            <h3 className="text-lg font-medium mb-2">Release Published!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your sound pack is now available on GitHub.
            </p>
            <Button asChild>
              <a href={releaseUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Release
              </a>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="githubToken">GitHub Token *</Label>
                <Input
                  id="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={formData.githubToken}
                  onChange={(e) =>
                    setFormData({ ...formData, githubToken: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Needs repo scope. Create at GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repoOwner">Repository Owner *</Label>
                  <Input
                    id="repoOwner"
                    placeholder="username"
                    value={formData.repoOwner}
                    onChange={(e) =>
                      setFormData({ ...formData, repoOwner: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repoName">Repository Name *</Label>
                  <Input
                    id="repoName"
                    placeholder="ccbell-sounds"
                    value={formData.repoName}
                    onChange={(e) =>
                      setFormData({ ...formData, repoName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="releaseTag">Release Tag *</Label>
                  <Input
                    id="releaseTag"
                    placeholder="v1.0.0"
                    value={formData.releaseTag}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseTag: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="releaseName">Release Name *</Label>
                  <Input
                    id="releaseName"
                    placeholder="My Sound Pack"
                    value={formData.releaseName}
                    onChange={(e) =>
                      setFormData({ ...formData, releaseName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your sound pack..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPublishing}>
                {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Publish
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
