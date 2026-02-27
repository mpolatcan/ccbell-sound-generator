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
import { PromptComponentsEditor } from './PromptComponentsEditor'
import { ModelLoadingIndicator } from './ModelLoadingIndicator'
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { useModelStatus } from '@/hooks/useModelStatus'
import { MODEL_DEFAULTS, DEFAULT_DURATION } from '@/lib/constants'
import { formatDuration } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, Package, ListOrdered, Plus } from 'lucide-react'
import type { GenerationSettings, HookTypeId, HookType, ThemePreset, EditablePromptChips, ChipItem } from '@/types'

export interface GeneratorFormRef {
  generate: () => void
}

interface GeneratorFormProps {
  selectedModel: 'small' | '1.0'
  onModelChange: (model: 'small' | '1.0') => void
  advancedSettings: GenerationSettings
}

export const GeneratorForm = forwardRef<GeneratorFormRef, GeneratorFormProps>(function GeneratorForm(
  { selectedModel, onModelChange, advancedSettings },
  ref
) {
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
  const [selectedTheme, setSelectedTheme] = useState('sci-fi')
  const [selectedHooks, setSelectedHooks] = useState<HookTypeId[]>(['Stop'])
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [packName, setPackName] = useState('')
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const toChips = (values: string[]): ChipItem[] =>
    values.map((label) => ({ label, enabled: true }))

  const [promptChips, setPromptChips] = useState<EditablePromptChips>({
    sound_type: [],
    style: [],
    instruments: [],
    mood: [],
    quality: [],
  })

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

  // Sync prompt chips when theme changes
  useEffect(() => {
    if (selectedTheme === 'custom') return
    const theme = themes.find((t: ThemePreset) => t.id === selectedTheme)
    if (!theme) return
    setPromptChips((prev) => ({
      ...prev,
      style: toChips(theme.prompt_components.style),
      instruments: toChips(theme.prompt_components.instruments),
      mood: toChips(theme.prompt_components.mood),
      quality: toChips(theme.prompt_components.quality),
    }))
  }, [selectedTheme, themes])

  // Sync sound_type chips when selected hooks change
  useEffect(() => {
    if (selectedHooks.length === 0) return
    const hook = hooks.find((h: HookType) => h.id === selectedHooks[0])
    if (!hook) return
    setPromptChips((prev) => ({
      ...prev,
      sound_type: toChips(hook.sound_characters),
    }))
  }, [selectedHooks, hooks])

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

  // Assemble prompt from chip selections
  // Order follows Stable Audio best practices: sound_type, style, instruments, mood, duration, quality
  const buildPrompt = (hookId?: string): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }

    // For multi-hook generation, use the specific hook's sound_characters
    let soundTypeChips = promptChips.sound_type
    if (hookId && hookId !== selectedHooks[0]) {
      const hook = hooks.find((h: HookType) => h.id === hookId)
      if (hook) soundTypeChips = toChips(hook.sound_characters)
    }

    const chipGroups = [
      soundTypeChips,
      promptChips.style,
      promptChips.instruments,
      promptChips.mood,
      [{ label: `${duration} seconds`, enabled: true }],
      promptChips.quality,
    ]

    const parts = chipGroups
      .map((group) =>
        group
          .filter((c) => c.enabled)
          .map((c) => c.label)
          .join(', ')
      )
      .filter((part) => part !== '')

    return parts.join(', ')
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
      <CardContent className="space-y-4">
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

        {/* Row 1: Sound Pack + Hook Types side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Hook Types */}
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
        </div>

        {/* Pack name input - full width below, only when creating new pack */}
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

        {/* Row 2: Theme Selection (pills) */}
        <div className="space-y-2">
          <Label>Theme</Label>
          {themesLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
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

        {/* Prompt Components Editor (hidden for Custom theme) */}
        {selectedTheme !== 'custom' && (
          <PromptComponentsEditor
            chips={promptChips}
            onChange={setPromptChips}
            assembledPrompt={currentPrompt}
          />
        )}

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

        {/* Row 3: Model + Duration side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label>Model</Label>
            {modelsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedModel} onValueChange={(v) => onModelChange(v as 'small' | '1.0')}>
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
        </div>

        {/* Model Loading Status - full width below */}
        <ModelLoadingIndicator
          status={modelStatus.status}
          progress={modelStatus.progress}
          stage={modelStatus.stage}
          error={modelStatus.error}
          modelName={models.find(m => m.id === selectedModel)?.name || selectedModel}
          onRetry={modelStatus.loadModel}
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
