import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ThemeSelector } from './ThemeSelector'
import { HookSelector } from './HookSelector'
import { AdvancedSettings } from './AdvancedSettings'
import { AudioPlayer } from './AudioPlayer'
import { useAudioGeneration } from '@/hooks/useAudioGeneration'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { MODEL_DEFAULTS, DEFAULT_DURATION } from '@/lib/constants'
import { formatDuration, getStageLabel } from '@/lib/utils'
import { Loader2, Sparkles, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import type { GenerationSettings } from '@/types'

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
  const [selectedHook, setSelectedHook] = useState('Notification')
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({})

  // Generation state
  const {
    isGenerating,
    progress,
    stage,
    error,
    completedAudioUrl,
    currentJobId,
    generate,
    reset
  } = useAudioGeneration()

  // Sound library
  const { addSound } = useSoundLibrary()

  // Get max duration for selected model
  const maxDuration = MODEL_DEFAULTS[selectedModel].max_duration

  // Update duration if it exceeds max for selected model
  useEffect(() => {
    if (duration > maxDuration) {
      setDuration(maxDuration)
    }
  }, [selectedModel, maxDuration, duration])

  // Build prompt from theme
  const buildPrompt = (): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }

    const theme = themes.find((t) => t.id === selectedTheme)
    if (!theme) return customPrompt

    const hook = hooks.find((h) => h.id === selectedHook)
    const soundType = hook?.sound_character || 'notification sound'

    return theme.prompt_template.replace('{sound_type}', soundType)
  }

  // Handle generation
  const handleGenerate = async () => {
    const prompt = buildPrompt()
    if (!prompt.trim() || isGenerating) {
      return
    }

    await generate({
      model: selectedModel,
      prompt,
      hook_type: selectedHook,
      duration,
      settings: Object.keys(advancedSettings).length > 0 ? advancedSettings : undefined
    })
  }

  // Expose generate method via ref
  useImperativeHandle(ref, () => ({
    generate: handleGenerate
  }))

  // Add to library
  const handleAddToLibrary = () => {
    if (!completedAudioUrl || !currentJobId) return

    addSound({
      id: crypto.randomUUID(),
      job_id: currentJobId,
      hook_type: selectedHook,
      prompt: buildPrompt(),
      model: selectedModel,
      duration,
      audio_url: completedAudioUrl,
      created_at: new Date()
    })

    // Reset for next generation
    reset()
  }

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
          <Label>Hook Type</Label>
          {hooksLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <HookSelector
              hooks={hooks}
              selectedHook={selectedHook}
              onSelect={setSelectedHook}
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
        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || isLoading || hasApiError || !currentPrompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {getStageLabel(stage)}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Sound
            </>
          )}
        </Button>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress * 100} />
            <p className="text-sm text-center text-muted-foreground">
              {getStageLabel(stage)} ({Math.round(progress * 100)}%)
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Result */}
        {completedAudioUrl && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Generated Sound</h4>
              <Button variant="outline" size="sm" onClick={handleAddToLibrary}>
                <Plus className="h-4 w-4 mr-2" />
                Add to Library
              </Button>
            </div>
            <AudioPlayer
              audioUrl={completedAudioUrl}
              filename={`${selectedHook.toLowerCase()}.wav`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
