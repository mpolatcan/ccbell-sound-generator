import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GeneratorForm } from '@/components/GeneratorForm'
import { SoundLibrary } from '@/components/SoundLibrary'
import { PublishDialog } from '@/components/PublishDialog'
import { Toaster } from '@/components/ui/toaster'
import { Bell, Github, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
})

function AppContent() {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [soundsToPublish, setSoundsToPublish] = useState<string[]>([])

  const handleSelectForPublish = (soundIds: string[]) => {
    setSoundsToPublish(soundIds)
    setPublishDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CCBell Sound Generator</h1>
              <p className="text-sm text-muted-foreground">
                AI-powered notification sounds for Claude Code
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://docs.anthropic.com/en/docs/claude-code/hooks"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Hooks Docs
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/anthropics/ccbell"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" />
                CCBell
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <div>
            <GeneratorForm />
          </div>

          {/* Sound Library */}
          <div>
            <SoundLibrary onSelectForPublish={handleSelectForPublish} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://huggingface.co/stabilityai/stable-audio-open-small"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Stable Audio Open
            </a>
            {' '}· Built for{' '}
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Claude Code
            </a>
          </p>
        </div>
      </footer>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        soundIds={soundsToPublish}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
