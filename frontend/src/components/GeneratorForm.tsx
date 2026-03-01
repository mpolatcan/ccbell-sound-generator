import { useState, useEffect, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react'
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
import { HookConfigTabs } from './HookConfigTabs'
import { PromptComponentsEditor } from './PromptComponentsEditor'
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { useShallow } from 'zustand/react/shallow'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { MODEL_DEFAULTS, DEFAULT_DURATION } from '@/lib/constants'
import { formatDuration } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, Package, ListOrdered, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationSettings, HookTypeId, HookType, ThemePreset, EditablePromptChips, ChipItem, PromptDetailTier, PerHookConfig } from '@/types'

export interface GeneratorFormRef {
  generate: () => void
}

interface GeneratorFormProps {
  selectedModel: 'small' | '1.0'
  advancedSettings: GenerationSettings
  modelReady: boolean
}

const EMPTY_THEMES: ThemePreset[] = []
const EMPTY_HOOKS: HookType[] = []

export const GeneratorForm = forwardRef<GeneratorFormRef, GeneratorFormProps>(function GeneratorForm(
  { selectedModel, advancedSettings, modelReady },
  ref
) {
  // Fetch data (stable defaults prevent infinite re-render loops from new [] references)
  const { data: themes = EMPTY_THEMES, isLoading: themesLoading, isError: themesError, refetch: refetchThemes } = useQuery({
    queryKey: ['themes'],
    queryFn: api.getThemes,
    retry: 2
  })

  const { data: hooks = EMPTY_HOOKS, isLoading: hooksLoading, isError: hooksError, refetch: refetchHooks } = useQuery({
    queryKey: ['hooks'],
    queryFn: api.getHooks,
    retry: 2
  })

  const isLoading = themesLoading || hooksLoading
  const hasApiError = themesError || hooksError

  const handleRetryAll = () => {
    refetchThemes()
    refetchHooks()
  }

  // Form state
  const [selectedTheme, setSelectedTheme] = useState('sci-fi')
  const [selectedHooks, setSelectedHooks] = useState<HookTypeId[]>([])
  const hooksInitialized = useRef(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(DEFAULT_DURATION)
  const [packName, setPackName] = useState('')
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [promptDetailTier, setPromptDetailTier] = useState<PromptDetailTier>('standard')
  const toChips = (values: string[]): ChipItem[] =>
    values.map((label) => ({ label, enabled: true }))

  const [promptChips, setPromptChips] = useState<EditablePromptChips>({
    sound_type: [],
    style: [],
    instruments: [],
    mood: [],
    quality: [],
  })

  // Per-hook configuration (sound_type chips + style preset per hook)
  const [perHookConfig, setPerHookConfig] = useState<Record<string, PerHookConfig>>({})
  const [activeHookTab, setActiveHookTab] = useState<HookTypeId | null>(null)

  // Generation queue (non-blocking)
  const { addToQueue, queueLength, error } = useGenerationQueue()

  // Sound library
  const { packs, addPack, addSound, getSoundsByPack } = useSoundLibrary(
    useShallow((s) => ({
      packs: s.packs,
      addPack: s.addPack,
      addSound: s.addSound,
      getSoundsByPack: s.getSoundsByPack,
    }))
  )

  // Select all hooks by default when hooks data loads (one-time only)
  useEffect(() => {
    if (!hooksInitialized.current && hooks.length > 0) {
      hooksInitialized.current = true
      setSelectedHooks(hooks.map((h: HookType) => h.id))
    }
  }, [hooks])

  // Get max duration for selected model
  const maxDuration = MODEL_DEFAULTS[selectedModel].max_duration

  // Update duration if it exceeds max for selected model
  useEffect(() => {
    if (duration > maxDuration) {
      setDuration(maxDuration)
    }
  }, [selectedModel, maxDuration, duration])

  // Sync shared prompt chips (style, instruments, mood, quality) when theme or detail tier changes
  useEffect(() => {
    if (selectedTheme === 'custom') return
    const theme = themes.find((t: ThemePreset) => t.id === selectedTheme)
    if (!theme) return
    const tierComponents = theme.prompt_components[promptDetailTier]
    setPromptChips((prev) => ({
      ...prev,
      style: toChips(tierComponents.style),
      instruments: toChips(tierComponents.instruments),
      mood: toChips(tierComponents.mood),
      quality: toChips(tierComponents.quality),
    }))
  }, [selectedTheme, themes, promptDetailTier])

  // Effect 1: Sync perHookConfig keys with selectedHooks — init new hooks, remove deselected, preserve existing
  useEffect(() => {
    setPerHookConfig((prev) => {
      const next: Record<string, PerHookConfig> = {}
      let changed = false
      for (const hookId of selectedHooks) {
        if (prev[hookId]) {
          next[hookId] = prev[hookId]
        } else {
          const hook = hooks.find((h) => h.id === hookId)
          next[hookId] = {
            soundTypeChips: hook ? toChips(hook.sound_characters[promptDetailTier]) : [],
            stylePresetId: null,
          }
          changed = true
        }
      }
      // Bail out if nothing changed (no hooks added/removed) to prevent unnecessary re-renders
      if (!changed && Object.keys(prev).length === selectedHooks.length) {
        return prev
      }
      return next
    })
  }, [selectedHooks, hooks, promptDetailTier])

  // Effect 2: Keep activeHookTab valid — default to first selected hook, move if active deselected
  useEffect(() => {
    setActiveHookTab((prev) => {
      if (selectedHooks.length === 0) return null
      if (prev && selectedHooks.includes(prev)) return prev
      return selectedHooks[0]
    })
  }, [selectedHooks])

  // Effect 3: Re-init soundTypeChips on promptDetailTier change — re-resolve each hook from its current preset at new tier
  const prevTierRef = useRef(promptDetailTier)
  useEffect(() => {
    if (prevTierRef.current === promptDetailTier) return
    prevTierRef.current = promptDetailTier
    setPerHookConfig((prev) => {
      if (Object.keys(prev).length === 0) return prev
      const next: Record<string, PerHookConfig> = {}
      for (const [hookId, config] of Object.entries(prev)) {
        const hook = hooks.find((h) => h.id === hookId)
        if (!hook) { next[hookId] = config; continue }
        let chips: ChipItem[]
        if (config.stylePresetId) {
          const preset = hook.sound_style_presets.find((p) => p.id === config.stylePresetId)
          chips = preset ? toChips(preset.sound_characters[promptDetailTier]) : toChips(hook.sound_characters[promptDetailTier])
        } else {
          chips = toChips(hook.sound_characters[promptDetailTier])
        }
        next[hookId] = { ...config, soundTypeChips: chips }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only re-resolve when tier changes; hooks read from closure is current
  }, [promptDetailTier])

  // Effect 4: Reset all per-hook configs on theme change — theme is a major context switch
  const prevThemeRef = useRef(selectedTheme)
  useEffect(() => {
    if (prevThemeRef.current === selectedTheme) return
    prevThemeRef.current = selectedTheme
    setPerHookConfig((prev) => {
      if (Object.keys(prev).length === 0) return prev
      const next: Record<string, PerHookConfig> = {}
      for (const hookId of Object.keys(prev)) {
        const hook = hooks.find((h) => h.id === hookId)
        next[hookId] = {
          soundTypeChips: hook ? toChips(hook.sound_characters[promptDetailTier]) : [],
          stylePresetId: null,
        }
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only reset when theme changes; hooks/tier read from closure is current
  }, [selectedTheme])

  // Derived values for active hook tab
  const activeHook = hooks.find((h: HookType) => h.id === activeHookTab)
  const activePresetId = activeHookTab ? perHookConfig[activeHookTab]?.stylePresetId ?? null : null

  // Construct editor chips: sound_type from active hook's perHookConfig, rest from shared promptChips
  const editorChips: EditablePromptChips = useMemo(() => ({
    sound_type: activeHookTab ? perHookConfig[activeHookTab]?.soundTypeChips ?? [] : [],
    style: promptChips.style,
    instruments: promptChips.instruments,
    mood: promptChips.mood,
    quality: promptChips.quality,
  }), [activeHookTab, perHookConfig, promptChips])

  // Handle style preset change for active hook
  const handleStylePresetChange = (presetId: string | null) => {
    if (!activeHookTab) return
    const hook = hooks.find((h: HookType) => h.id === activeHookTab)
    if (!hook) return
    let chips: ChipItem[]
    if (presetId) {
      const preset = hook.sound_style_presets.find((p) => p.id === presetId)
      chips = preset ? toChips(preset.sound_characters[promptDetailTier]) : toChips(hook.sound_characters[promptDetailTier])
    } else {
      chips = toChips(hook.sound_characters[promptDetailTier])
    }
    setPerHookConfig((prev) => ({
      ...prev,
      [activeHookTab]: { soundTypeChips: chips, stylePresetId: presetId },
    }))
  }

  // Handle chips change — route sound_type to active hook's perHookConfig, shared categories to promptChips
  const handleChipsChange = useCallback((updated: EditablePromptChips) => {
    if (activeHookTab) {
      setPerHookConfig((prev) => ({
        ...prev,
        [activeHookTab]: {
          ...prev[activeHookTab],
          soundTypeChips: updated.sound_type,
        },
      }))
    }
    setPromptChips((prev) => ({
      ...prev,
      style: updated.style,
      instruments: updated.instruments,
      mood: updated.mood,
      quality: updated.quality,
    }))
  }, [activeHookTab])

  // Generate default pack name from theme
  const getDefaultPackName = () => {
    const theme = themes.find((t: ThemePreset) => t.id === selectedTheme)
    const themeName = theme?.name || selectedTheme
    const now = new Date()
    const date = now.toLocaleDateString('en-CA') // YYYY-MM-DD
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${themeName} - ${date} ${time}`
  }

  // Assemble prompt from chip selections for a specific hook
  // Order follows Stable Audio best practices: sound_type, style, instruments, mood, duration, quality
  const buildPrompt = (hookId?: string): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }

    const targetHookId = hookId ?? activeHookTab
    let soundTypeChips: ChipItem[] = []
    if (targetHookId && perHookConfig[targetHookId]) {
      soundTypeChips = perHookConfig[targetHookId].soundTypeChips
    } else if (targetHookId) {
      // Fallback: use hook's default sound_characters
      const hook = hooks.find((h: HookType) => h.id === targetHookId)
      if (hook) soundTypeChips = toChips(hook.sound_characters[promptDetailTier])
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- buildPrompt reads from multiple state values
  const currentPrompt = useMemo(() => buildPrompt(), [selectedTheme, customPrompt, promptChips, perHookConfig, activeHookTab, duration, hooks, promptDetailTier])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Sound
        </CardTitle>
        <CardDescription>
          Create AI-powered notification sounds for Claude Code ccbell plugin
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

        {/* Row 1: Hook Types + Sound Pack side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                promptDetailTier={promptDetailTier}
              />
            )}
          </div>

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

        {/* Theme Selection (pills) */}
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

        {/* Prompt Detail Level */}
        {selectedTheme !== 'custom' && (
          <div className="space-y-2">
            <Label>Prompt Detail</Label>
            <div className="flex gap-2">
              {(['simple', 'standard', 'detailed'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all border cursor-pointer',
                    promptDetailTier === tier
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                  onClick={() => setPromptDetailTier(tier)}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {promptDetailTier === 'simple' && 'Minimal descriptors for shorter, focused prompts'}
              {promptDetailTier === 'standard' && 'Balanced set of descriptors (recommended)'}
              {promptDetailTier === 'detailed' && 'Rich descriptors for more specific, detailed prompts'}
            </p>
          </div>
        )}

        {/* Hook Config Tabs (shown when hooks selected and theme is not custom) */}
        {selectedTheme !== 'custom' && selectedHooks.length > 0 && (
          <div className="space-y-2">
            <Label>Hook Sound Config</Label>
            <HookConfigTabs
              hooks={hooks}
              selectedHooks={selectedHooks}
              activeTab={activeHookTab}
              onTabChange={setActiveHookTab}
            />
          </div>
        )}

        {/* Sound Style Presets (per active hook, shown when theme is not custom) */}
        {selectedTheme !== 'custom' && activeHook && activeHook.sound_style_presets.length > 0 && (
          <div className="space-y-2">
            <Label>Sound Style</Label>
            <div className="flex flex-wrap gap-2">
              {activeHook.sound_style_presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.description}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all border cursor-pointer',
                    (activePresetId === preset.id ||
                      (!activePresetId && preset.id === activeHook.sound_style_presets[0]?.id))
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                  onClick={() => handleStylePresetChange(
                    preset.id === activeHook.sound_style_presets[0]?.id && !activePresetId
                      ? null
                      : preset.id
                  )}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Components Editor (hidden for Custom theme) */}
        {selectedTheme !== 'custom' && (
          <PromptComponentsEditor
            chips={editorChips}
            onChange={handleChipsChange}
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

        {/* Generate Button */}
        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            onClick={handleGenerate}
            disabled={isLoading || hasApiError || selectedHooks.length === 0 || !currentPrompt.trim() || !modelReady}
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
