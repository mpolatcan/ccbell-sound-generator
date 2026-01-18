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
import { Badge } from '@/components/ui/badge'
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
  const [selectedHooks, setSelectedHooks] = useState<string[]>(['Notification'])
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [advancedSettings, setAdvancedSettings] = useState<GenerationSettings>({})

  // Sequential generation state
  const [generationQueue, setGenerationQueue] = useState<string[]>([])
  const [currentGeneratingHook, setCurrentGeneratingHook] = useState<string | null>(null)
  const [completedGenerations, setCompletedGenerations] = useState<Array<{
    hookId: string
    audioUrl: string
    jobId: string
  }>>([])
  const [isSequentialGenerating, setIsSequentialGenerating] = useState(false)

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
  const buildPrompt = (hookId?: string): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }

    const theme = themes.find((t) => t.id === selectedTheme)
    if (!theme) return customPrompt

    const targetHookId = hookId || selectedHooks[0]
    const hook = hooks.find((h) => h.id === targetHookId)
    const soundType = hook?.sound_character || 'notification sound'

    return theme.prompt_template.replace('{sound_type}', soundType)
  }

  // Generate a single sound for a specific hook
  const generateSingleSound = async (hookId: string) => {
    const prompt = buildPrompt(hookId)
    if (!prompt.trim()) return

    setCurrentGeneratingHook(hookId)

    try {
      await generate({
        model: selectedModel,
        prompt,
        hook_type: hookId,
        duration,
        settings: Object.keys(advancedSettings).length > 0 ? advancedSettings : undefined
      })
    } catch {
      // Error is handled by useAudioGeneration
      setIsSequentialGenerating(false)
      setGenerationQueue([])
      setCurrentGeneratingHook(null)
    }
  }

  // Handle generation - start sequential generation
  const handleGenerate = async () => {
    if (selectedHooks.length === 0 || isGenerating || isSequentialGenerating) {
      return
    }

    // Reset completed generations
    setCompletedGenerations([])

    if (selectedHooks.length === 1) {
      // Single hook - simple generation
      await generateSingleSound(selectedHooks[0])
    } else {
      // Multiple hooks - sequential generation
      setIsSequentialGenerating(true)
      setGenerationQueue([...selectedHooks])

      // Start first generation
      await generateSingleSound(selectedHooks[0])
    }
  }

  // Effect to handle sequential generation completion
  useEffect(() => {
    if (completedAudioUrl && currentGeneratingHook && currentJobId) {
      // Save completed generation
      setCompletedGenerations(prev => [
        ...prev,
        { hookId: currentGeneratingHook, audioUrl: completedAudioUrl, jobId: currentJobId }
      ])

      // Check if there are more hooks in the queue
      const currentIndex = generationQueue.indexOf(currentGeneratingHook)
      const nextHook = generationQueue[currentIndex + 1]

      if (nextHook && isSequentialGenerating) {
        // Generate next sound after a short delay
        reset()
        setTimeout(() => {
          generateSingleSound(nextHook)
        }, 500)
      } else {
        // All generations complete
        setIsSequentialGenerating(false)
        setGenerationQueue([])
        setCurrentGeneratingHook(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedAudioUrl, currentGeneratingHook, currentJobId])

  // Expose generate method via ref
  useImperativeHandle(ref, () => ({
    generate: handleGenerate
  }))

  // Add single generation to library
  const handleAddToLibrary = () => {
    if (!completedAudioUrl || !currentJobId || !currentGeneratingHook) return

    addSound({
      id: crypto.randomUUID(),
      job_id: currentJobId,
      hook_type: currentGeneratingHook,
      prompt: buildPrompt(currentGeneratingHook),
      model: selectedModel,
      duration,
      audio_url: completedAudioUrl,
      created_at: new Date()
    })

    // Reset for next generation
    reset()
    setCurrentGeneratingHook(null)
  }

  // Add all completed generations to library
  const handleAddAllToLibrary = () => {
    completedGenerations.forEach(gen => {
      addSound({
        id: crypto.randomUUID(),
        job_id: gen.jobId,
        hook_type: gen.hookId,
        prompt: buildPrompt(gen.hookId),
        model: selectedModel,
        duration,
        audio_url: gen.audioUrl,
        created_at: new Date()
      })
    })

    // Reset
    setCompletedGenerations([])
    reset()
    setCurrentGeneratingHook(null)
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
        <Button
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || isSequentialGenerating || isLoading || hasApiError || selectedHooks.length === 0 || !currentPrompt.trim()}
        >
          {isGenerating || isSequentialGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {currentGeneratingHook && hooks.find(h => h.id === currentGeneratingHook)?.name}: {getStageLabel(stage)}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {selectedHooks.length > 1 ? `${selectedHooks.length} Sounds` : 'Sound'}
            </>
          )}
        </Button>

        {/* Progress */}
        {(isGenerating || isSequentialGenerating) && (
          <div className="space-y-3">
            {/* Sequential generation progress */}
            {generationQueue.length > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Generating {completedGenerations.length + 1} of {generationQueue.length}
                </span>
                {currentGeneratingHook && (
                  <Badge variant="secondary">
                    {hooks.find(h => h.id === currentGeneratingHook)?.name}
                  </Badge>
                )}
              </div>
            )}
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

        {/* Completed Generations (multiple) */}
        {completedGenerations.length > 1 && !isSequentialGenerating && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Generated Sounds ({completedGenerations.length})</h4>
              <Button variant="outline" size="sm" onClick={handleAddAllToLibrary}>
                <Plus className="h-4 w-4 mr-2" />
                Add All to Library
              </Button>
            </div>
            <div className="space-y-3">
              {completedGenerations.map((gen) => {
                const hook = hooks.find(h => h.id === gen.hookId)
                return (
                  <div key={gen.jobId} className="space-y-2 p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{hook?.name || gen.hookId}</Badge>
                    </div>
                    <AudioPlayer
                      audioUrl={gen.audioUrl}
                      filename={`${gen.hookId.toLowerCase()}.wav`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Single Result */}
        {completedAudioUrl && completedGenerations.length <= 1 && !isSequentialGenerating && (
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
              filename={`${(currentGeneratingHook || selectedHooks[0] || 'sound').toLowerCase()}.wav`}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
