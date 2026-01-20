import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ThemeSelector } from './ThemeSelector'
import { HookSelector } from './HookSelector'
import { AdvancedSettings } from './AdvancedSettings'
import { ModelLoadingIndicator } from './ModelLoadingIndicator'
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { useModelStatus } from '@/hooks/useModelStatus'
import { MODEL_DEFAULTS, DEFAULT_DURATION } from '@/lib/constants'
import { formatDuration } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, Package, ListOrdered, Plus } from 'lucide-react'
import type { GenerationSettings, HookTypeId, ThemePreset } from '@/types'

export interface GeneratorFormRef {
  generate: () => void
}

export const GeneratorForm = forwardRef<GeneratorFormRef>(function GeneratorForm(_, ref) {
  // Fetch data
  const { data: themes = [], isLoading: themesLoading, isError: themesError, refetch: refetchThemes } = useQuery({
    queryKey: ['themes'],
    queryFn: api.getThemes,
    retry: 2
  })

  const { data: hooks = [], isLoading: hooksLoading, isError: hooksError, refetch: refetchHooks } = useQuery({
    queryKey: ['hooks'],
    queryFn: api.getHooks,
    retry: 2
  })

  const { data: models = [], isLoading: modelsLoading, isError: modelsError, refetch: refetchModels } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
    retry: 2
  })

  const isLoading = themesLoading || hooksLoading || modelsLoading
  const hasApiError = themesError || hooksError || modelsError

  const handleRetryAll = () => {
    refetchThemes()
    refetchHooks()
    refetchModels()
  }

  // Form state
  const [selectedModel, setSelectedModel] = useState<'small' | '1.0'>('small')
  const [selectedTheme, setSelectedTheme] = useState('sci-fi')
  const [selectedHooks, setSelectedHooks] = useState<HookTypeId[]>(['Notification'])
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({})
  const [packName, setPackName] = useState('')
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)

  // Generation queue (non-blocking)
  const { addToQueue, queueLength, error } = useGenerationQueue()

  // Sound library
  const { packs, addPack, addSound, getSoundsByPack } = useSoundLibrary()

  // Model loading status
  const modelStatus = useModelStatus({
    modelId: selectedModel,
    pollInterval: 2000,
    autoLoad: true
  })

  // Get max duration for selected model
  const maxDuration = MODEL_DEFAULTS[selectedModel].max_duration

  // Update duration if it exceeds max for selected model
  useEffect(() => {
    if (duration > maxDuration) {
      setDuration(maxDuration)
    }
  }, [selectedModel, maxDuration, duration])

  // Generate default pack name from theme
  const getDefaultPackName = () => {
    const theme = themes.find((t: ThemePreset) => t.id === selectedTheme)
    const themeName = theme?.name || selectedTheme
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${themeName} - ${timestamp}`
  }

  // Build prompt from theme
  const buildPrompt = (hookId?: string): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }

    const theme = themes.find((t: ThemePreset) => t.id === selectedTheme)
    if (!theme) return customPrompt

    const targetHookId = hookId || selectedHooks[0]
    const hook = hooks.find((h) => h.id === targetHookId)
    const soundType = hook?.sound_character || 'notification sound'

    return theme.prompt_template.replace('{sound_type}', soundType)
  }

  // Handle generation - create pack (if new) and queue all sounds
  const handleGenerate = () => {
    if (selectedHooks.length === 0) {
      return
    }

    let packId: string

    if (selectedPackId) {
      // Use existing pack
      packId = selectedPackId
    } else {
      // Create new pack
      packId = crypto.randomUUID()
      const name = packName.trim() || getDefaultPackName()

      addPack({
        id: packId,
        name,
        theme: selectedTheme,
        model: selectedModel,
        created_at: new Date()
      })
    }

    // Add all sounds to library and queue them for generation
    selectedHooks.forEach((hookId) => {
      const soundId = crypto.randomUUID()
      const prompt = buildPrompt(hookId)

      // Add sound to library with 'generating' status (queued)
      addSound({
        id: soundId,
        job_id: '',
        pack_id: packId,
        hook_type: hookId,
        prompt,
        model: selectedModel,
        duration,
        audio_url: '',
        status: 'generating',
        progress: 0,
        stage: 'Queued',
        created_at: new Date()
      })

      // Add to generation queue
      addToQueue(soundId, packId, {
        model: selectedModel,
        prompt,
        hook_type: hookId,
        duration,
        settings: Object.keys(advancedSettings).length > 0 ? advancedSettings : undefined
      })
    })

    // Reset pack name for next generation (keep selectedPackId for easy batch additions)
    setPackName('')
  }

  // Expose generate method via ref
  useImperativeHandle(ref, () => ({
    generate: handleGenerate
  }))

  const currentPrompt = buildPrompt()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Sound
        </CardTitle>
        <CardDescription>
          Create AI-powered notification sounds for Claude Code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Error State */}
        {hasApiError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Failed to load configuration</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Could not connect to the API. Please check if the backend server is running.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryAll}
                  className="mt-3"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sound Pack Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sound Pack
          </Label>
          <Select
            value={selectedPackId || 'new'}
            onValueChange={(v) => setSelectedPackId(v === 'new' ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Create New Pack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create New Pack</span>
                </div>
              </SelectItem>
              {packs.length > 0 && (
                <>
                  <SelectSeparator />
                  {packs.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{pack.name}</span>
                        <span className="text-muted-foreground">
                          ({getSoundsByPack(pack.id).length} sounds)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
          {/* Pack name input - only shown when creating new pack */}
          {selectedPackId === null && (
            <div className="space-y-1">
              <Input
                placeholder={getDefaultPackName()}
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate name from theme
              </p>
            </div>
          )}
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Model</Label>
          {modelsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as 'small' | '1.0')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.parameters} · Max {model.max_duration}s
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Model Loading Status */}
          <ModelLoadingIndicator
            status={modelStatus.status}
            progress={modelStatus.progress}
            stage={modelStatus.stage}
            error={modelStatus.error}
            modelName={models.find(m => m.id === selectedModel)?.name || selectedModel}
            onRetry={modelStatus.loadModel}
          />
        </div>

        {/* Theme Selection */}
        <div className="space-y-2">
          <Label>Theme</Label>
          {themesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <ThemeSelector
              themes={themes}
              selectedTheme={selectedTheme}
              onSelect={setSelectedTheme}
            />
          )}
        </div>

        {/* Custom Prompt (if custom theme selected) */}
        {selectedTheme === 'custom' && (
          <div className="space-y-2">
            <Label>Custom Prompt</Label>
            <Textarea
              placeholder="Describe the sound you want to generate..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Preview Prompt */}
        {selectedTheme !== 'custom' && currentPrompt && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Generated Prompt</Label>
            <p className="text-sm bg-muted/50 p-3 rounded-md">
              {currentPrompt}
            </p>
          </div>
        )}

        {/* Hook Type */}
        <div className="space-y-2">
          <Label>Hook Types</Label>
          {hooksLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <HookSelector
              hooks={hooks}
              selectedHooks={selectedHooks}
              onSelect={setSelectedHooks}
            />
          )}
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Duration</Label>
            <span className="text-sm text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={(v) => setDuration(v[0])}
            min={0.5}
            max={maxDuration}
            step={0.5}
          />
          <p className="text-xs text-muted-foreground">
            Max {maxDuration}s for {selectedModel === 'small' ? 'Small' : '1.0'} model
          </p>
        </div>

        {/* Advanced Settings */}
        <AdvancedSettings
          model={selectedModel}
          settings={advancedSettings}
          onChange={setAdvancedSettings}
        />

        {/* Generate Button */}
        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isLoading || hasApiError || selectedHooks.length === 0 || !currentPrompt.trim() || !modelStatus.isReady}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate {selectedHooks.length > 1 ? `${selectedHooks.length} Sounds` : 'Sound'}
          </Button>
          {queueLength > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ListOrdered className="h-4 w-4" />
              <span>{queueLength} {queueLength === 1 ? 'sound' : 'sounds'} in queue</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
