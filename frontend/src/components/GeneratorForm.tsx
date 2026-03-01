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
import { Sparkles, RefreshCw, AlertCircle, Package, ListOrdered, Plus, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
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

/** Thin labeled divider between form sections */
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-border/40" />
      <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest select-none">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  )
}

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

  const [promptExpanded, setPromptExpanded] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(currentPrompt).then(() => {
      setPromptCopied(true)
      setTimeout(() => setPromptCopied(false), 1500)
    })
  }, [currentPrompt])

  const canGenerate = !isLoading && !hasApiError && selectedHooks.length > 0 && currentPrompt.trim() && modelReady

  return (
    <Card className="card-elevated lg:max-h-[calc(100vh-160px)] flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Sound
        </CardTitle>
        <CardDescription>
          Create AI-powered notification sounds for Claude Code
        </CardDescription>
      </CardHeader>

      {/* Scrollable configuration area */}
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-0 pt-0">
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin generator-scroll-area">
          <div className="space-y-4 pb-2">
            {/* API Error State */}
            {hasApiError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg animate-fade-in">
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

            {/* ═══ SECTION: Pack Config ═══ */}
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
                  <Package className="h-3.5 w-3.5" />
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

            {/* Pack name input */}
            {selectedPackId === null && (
              <div className="space-y-1">
                <Input
                  placeholder={getDefaultPackName()}
                  value={packName}
                  onChange={(e) => setPackName(e.target.value)}
                  className="placeholder:text-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate name from theme
                </p>
              </div>
            )}

            {/* ═══ SECTION: Sound Design ═══ */}
            <SectionDivider label="Sound Design" />

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label>Theme</Label>
              {themesLoading ? (
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
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

            {/* Prompt Detail Level — segmented control */}
            {selectedTheme !== 'custom' && (
              <div className="space-y-2">
                <Label>Prompt Detail</Label>
                <div className="inline-flex rounded-lg border border-border/60 bg-muted/20 p-0.5">
                  {(['simple', 'standard', 'detailed'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={cn(
                        'px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                        promptDetailTier === tier
                          ? 'bg-primary/15 text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
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

            {/* ═══ SECTION: Hook Config ═══ */}
            {selectedTheme !== 'custom' && selectedHooks.length > 0 && (
              <>
                <SectionDivider label="Hook Config" />

                {/* Hook Config Tabs */}
                <div className="space-y-2">
                  <Label>Hook Sound Config</Label>
                  <HookConfigTabs
                    hooks={hooks}
                    selectedHooks={selectedHooks}
                    activeTab={activeHookTab}
                    onTabChange={setActiveHookTab}
                  />
                </div>

                {/* Sound Style Presets */}
                {activeHook && activeHook.sound_style_presets.length > 0 && (
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
                              ? 'border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10'
                              : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
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
              </>
            )}

            {/* ═══ SECTION: Prompt ═══ */}
            <SectionDivider label="Prompt" />

            {/* Prompt Components Editor (hidden for Custom theme) */}
            {selectedTheme !== 'custom' && (
              <PromptComponentsEditor
                chips={editorChips}
                onChange={handleChipsChange}
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
                  className="placeholder:text-muted-foreground/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ PINNED BOTTOM: Prompt Preview + Duration + Generate ═══ */}
        <div className="shrink-0 border-t border-border/30 pt-4 mt-2 space-y-3 bg-card">
          {/* Live prompt preview — fully visible, expandable */}
          {currentPrompt.trim() && selectedTheme !== 'custom' && (
            <div className="relative rounded-md overflow-hidden border border-border/30 bg-muted/10 group/prompt">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
              <div className="flex items-start gap-2 py-2 pl-3 pr-2">
                <span className="text-primary/40 text-[10px] font-mono select-none shrink-0 mt-0.5">&gt;</span>
                <p
                  className={cn(
                    "text-[11px] font-mono break-words leading-relaxed text-foreground/60 flex-1 cursor-pointer select-none transition-all",
                    !promptExpanded && "line-clamp-3"
                  )}
                  onClick={() => setPromptExpanded((v) => !v)}
                  title={promptExpanded ? "Click to collapse" : "Click to expand full prompt"}
                >
                  {currentPrompt}
                </p>
                <div className="flex items-center gap-0.5 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="p-1 rounded text-muted-foreground/40 hover:text-foreground/60 transition-colors"
                    title="Copy prompt"
                  >
                    {promptCopied ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromptExpanded((v) => !v)}
                    className="p-1 rounded text-muted-foreground/40 hover:text-foreground/60 transition-colors"
                    title={promptExpanded ? "Collapse" : "Expand"}
                  >
                    {promptExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Duration - compact inline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Duration</Label>
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                {formatDuration(duration)} / {maxDuration}s max
              </span>
            </div>
            <Slider
              value={[duration]}
              onValueChange={(v) => setDuration(v[0])}
              min={0.5}
              max={maxDuration}
              step={0.5}
            />
          </div>

          {/* Generate Button */}
          <Button
            className={cn(
              "w-full font-display font-semibold tracking-wide btn-press transition-transform",
              canGenerate && "btn-glow"
            )}
            size="lg"
            onClick={handleGenerate}
            disabled={!canGenerate}
            title="Generate Sound (G)"
          >
            <Sparkles className={cn("h-4 w-4 mr-2", queueLength > 0 && "sparkle-spin")} />
            Generate {selectedHooks.length > 1 ? `${selectedHooks.length} Sounds` : 'Sound'}
          </Button>

          {queueLength > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in">
              <ListOrdered className="h-4 w-4" />
              <span>{queueLength} {queueLength === 1 ? 'sound' : 'sounds'} in queue</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg animate-fade-in">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
