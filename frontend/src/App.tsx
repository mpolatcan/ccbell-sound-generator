import { useState, useRef, useCallback, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTauriBackend } from '@/hooks/useTauriBackend'
import { useSettings } from '@/hooks/useSettings'
import { DesktopBootScreen } from '@/components/DesktopBootScreen'
import { GeneratorForm, GeneratorFormRef } from '@/components/GeneratorForm'
import { ModelSettings } from '@/components/ModelSettings'
import { SoundLibrary, SoundLibraryRef } from '@/components/SoundLibrary'
import { PublishDialog } from '@/components/PublishDialog'
import { DownloadPackDialog } from '@/components/DownloadPackDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp'
import { Toaster } from '@/components/ui/toaster'
import { Bell, Github, ExternalLink, Keyboard, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { toast } from '@/hooks/useToast'
import { api } from '@/lib/api'
import { useModelStatus } from '@/hooks/useModelStatus'
import type { PublishPackData, DownloadPackData, GenerationSettings } from '@/types'

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
  const [packDataToPublish, setPackDataToPublish] = useState<PublishPackData | null>(null)
  const [publishEnabled, setPublishEnabled] = useState(false)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [packDataToDownload, setPackDataToDownload] = useState<DownloadPackData | null>(null)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState('small')
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({
    steps: 16,
    cfg_scale: 2.0,
    sampler: 'pingpong'
  })
  const { settings, saveSettings, isDesktop } = useSettings()
  const modelStatus = useModelStatus({
    modelId: selectedModel,
    pollInterval: 2000,
    autoLoad: true
  })

  useEffect(() => {
    api.getHealth().then((health) => {
      setPublishEnabled(health.publish_enabled)
    }).catch(() => {})
  }, [])

  const generatorFormRef = useRef<GeneratorFormRef>(null)
  const soundLibraryRef = useRef<SoundLibraryRef>(null)

  const handleSelectForPublish = (data: PublishPackData) => {
    setPackDataToPublish(data)
    setPublishDialogOpen(true)
  }

  const handleSelectForDownload = (data: DownloadPackData) => {
    setPackDataToDownload(data)
    setDownloadDialogOpen(true)
  }

  const handleGenerate = useCallback(() => {
    generatorFormRef.current?.generate()
  }, [])

  const handleClearLibrary = useCallback(() => {
    soundLibraryRef.current?.clearAll()
    toast({
      title: 'Library cleared',
      description: 'All sounds have been removed from the library.'
    })
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'g',
      action: handleGenerate,
      description: 'Generate sound'
    },
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      action: handleClearLibrary,
      description: 'Clear library'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => setShortcutsHelpOpen(true),
      description: 'Show shortcuts help'
    }
  ])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-sm bg-background/80 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Bell className="h-5 w-5 text-primary relative z-10" />
              {/* Sound wave rings */}
              <span className="sound-ring absolute inset-0" style={{ animationDelay: '0s' }} />
              <span className="sound-ring absolute inset-0" style={{ animationDelay: '0.6s' }} />
              <span className="sound-ring absolute inset-0" style={{ animationDelay: '1.2s' }} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">
                <span className="text-gradient">CCBell</span>{' '}
                <span className="text-foreground/80">Sound Generator</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI-powered notification sounds for Claude Code
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1.5">
            {isDesktop && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                title="Settings"
                className="text-muted-foreground hover:text-foreground h-9 w-9 sm:h-8 sm:w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShortcutsHelpOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="text-muted-foreground hover:text-foreground h-9 w-9 sm:h-8 sm:w-8"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <a
                href="https://docs.anthropic.com/en/docs/claude-code/hooks"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Hooks Docs</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-border/60">
              <a
                href="https://github.com/anthropics/ccbell"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-1.5" />
                CCBell
              </a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6 flex-1">
        {/* Row 1: Generator Form + Model Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GeneratorForm
            ref={generatorFormRef}
            selectedModel={selectedModel}
            advancedSettings={advancedSettings}
            modelReady={modelStatus.isReady}
          />
          <ModelSettings
            model={selectedModel}
            onModelChange={setSelectedModel}
            modelStatus={modelStatus}
            settings={advancedSettings}
            onChange={setAdvancedSettings}
          />
        </div>

        {/* Row 2: Sound Library (full width) */}
        <SoundLibrary
          ref={soundLibraryRef}
          onSelectForPublish={(publishEnabled || Boolean(settings.github_token)) ? handleSelectForPublish : undefined}
          onSelectForDownload={handleSelectForDownload}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <a
              href="https://huggingface.co/stabilityai/stable-audio-open-small"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-primary transition-colors"
            >
              Stable Audio Open
            </a>
            {' '}&middot;{' '}Built for{' '}
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-primary transition-colors"
            >
              Claude Code
            </a>
          </p>
          <p className="text-muted-foreground/60">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border/60 rounded">G</kbd>
            {' '}Generate{' '}&middot;{' '}
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border/60 rounded">?</kbd>
            {' '}All shortcuts
          </p>
        </div>
      </footer>

      {/* Download Pack Dialog */}
      <DownloadPackDialog
        open={downloadDialogOpen}
        onOpenChange={setDownloadDialogOpen}
        packData={packDataToDownload}
      />

      {/* Publish Dialog */}
      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        packData={packDataToPublish}
      />

      {/* Settings Dialog (desktop only) */}
      {isDesktop && (
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={saveSettings}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
      />

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

function App() {
  const backend = useTauriBackend()

  // Show boot screen while desktop app starts the backend
  if (backend.isDesktop && !backend.ready) {
    return <DesktopBootScreen stage={backend.stage} error={backend.error} onRetry={backend.retry} />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App
