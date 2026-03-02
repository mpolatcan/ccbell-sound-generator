import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
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
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { useShallow } from 'zustand/react/shallow'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { MODEL_DEFAULTS, DEFAULT_DURATION } from '@/lib/constants'
import { formatDuration } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, Package, ListOrdered, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GenerationSettings, HookTypeId, HookType, ThemePreset, PerHookConfig, SubTheme } from '@/types'

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
const DEFAULT_HOOK_CONFIG: PerHookConfig = { editedPrompt: null }

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

  // Global sub-theme selection (correlated across all hooks)
  const [selectedSubTheme, setSelectedSubTheme] = useState<string | null>(null)

  // Per-hook configuration (edited prompt only)
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


  // Effect 1: Sync perHookConfig keys with selectedHooks — init new hooks, remove deselected, preserve existing
  useEffect(() => {
    setPerHookConfig((prev) => {
      const next: Record<string, PerHookConfig> = {}
      let changed = false
      for (const hookId of selectedHooks) {
        if (prev[hookId]) {
          next[hookId] = prev[hookId]
        } else {
          next[hookId] = { ...DEFAULT_HOOK_CONFIG }
          changed = true
        }
      }
      if (!changed && Object.keys(prev).length === selectedHooks.length) {
        return prev
      }
      return next
    })
  }, [selectedHooks])

  // Effect 2: Keep activeHookTab valid — default to first selected hook, move if active deselected
  useEffect(() => {
    setActiveHookTab((prev) => {
      if (selectedHooks.length === 0) return null
      if (prev && selectedHooks.includes(prev)) return prev
      return selectedHooks[0]
    })
  }, [selectedHooks])

  // Effect 3: Reset all per-hook configs and sub-theme on theme change — theme is a major context switch
  const prevThemeRef = useRef(selectedTheme)
  useEffect(() => {
    if (prevThemeRef.current === selectedTheme) return
    prevThemeRef.current = selectedTheme
    setSelectedSubTheme(null)
    setPerHookConfig((prev) => {
      if (Object.keys(prev).length === 0) return prev
      const next: Record<string, PerHookConfig> = {}
      for (const hookId of Object.keys(prev)) {
        next[hookId] = { ...DEFAULT_HOOK_CONFIG }
      }
      return next
    })
  }, [selectedTheme])

  // Resolve the effective sub-theme object
  const selectedThemeObj = themes.find((t) => t.id === selectedTheme)
  const subThemes = selectedThemeObj?.sub_themes ?? []
  const effectiveSubThemeId = selectedSubTheme ?? subThemes[0]?.id ?? null
  const effectiveSubTheme: SubTheme | undefined = subThemes.find((s) => s.id === effectiveSubThemeId)

  // Get prompt for a hook from the current sub-theme
  const getPromptForHook = useCallback((hookId: string): string => {
    return effectiveSubTheme?.prompts[hookId] ?? ''
  }, [effectiveSubTheme])

  // Handle global sub-theme change — reset per-hook prompt edits
  const handleSubThemeChange = (subThemeId: string) => {
    setSelectedSubTheme(subThemeId)
    setPerHookConfig((prev) => {
      const next: Record<string, PerHookConfig> = {}
      for (const hookId of Object.keys(prev)) {
        next[hookId] = { ...DEFAULT_HOOK_CONFIG }
      }
      return next
    })
  }

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

  // Build final prompt text for a specific hook
  const buildPrompt = (hookId: string): string => {
    if (selectedTheme === 'custom') {
      return customPrompt
    }
    const config = perHookConfig[hookId]
    const basePrompt = getPromptForHook(hookId)
    if (!basePrompt) return ''
    const text = config?.editedPrompt ?? basePrompt
    return text
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

      // Resolve style name for this hook
      const styleName = selectedTheme !== 'custom' ? effectiveSubTheme?.name : undefined

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
        created_at: new Date(),
        style_name: styleName,
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

  // Determine if we can generate
  const activePrompt = activeHookTab ? getPromptForHook(activeHookTab) : ''
  const hasPrompt = selectedTheme === 'custom' ? customPrompt.trim().length > 0 : activePrompt.length > 0
  const canGenerate = !isLoading && !hasApiError && selectedHooks.length > 0 && hasPrompt && modelReady

  // Inline prompt display for the active hook tab
  const activeHookBasePrompt = activeHookTab ? getPromptForHook(activeHookTab) : ''
  const activeHookConfig = activeHookTab ? perHookConfig[activeHookTab] : undefined
  const activeHookFullOriginal = activeHookBasePrompt || ''
  const activeHookDisplayText = activeHookConfig?.editedPrompt ?? activeHookFullOriginal

  // Auto-resize textarea ref
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = promptTextareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [activeHookDisplayText])

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

            {/* Sub Theme — global sub-theme selector */}
            {selectedTheme !== 'custom' && subThemes.length > 0 && (
              <div className="space-y-2">
                <Label>Sub Theme</Label>
                <Select
                  value={effectiveSubThemeId ?? ''}
                  onValueChange={handleSubThemeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subThemes.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prompts — per-hook prompt preview/edit */}
            {selectedTheme !== 'custom' && selectedHooks.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label>Prompts</Label>
                  <HookConfigTabs
                    hooks={hooks}
                    selectedHooks={selectedHooks}
                    activeTab={activeHookTab}
                    onTabChange={setActiveHookTab}
                  />
                </div>

                {/* Inline prompt display */}
                {activeHookTab && activeHookBasePrompt && (
                  <div className="space-y-2">
                    <Label>Prompt</Label>
                    <div className="relative">
                      <Textarea
                        ref={promptTextareaRef}
                        value={activeHookDisplayText}
                        onChange={(e) => {
                          setPerHookConfig((prev) => ({
                            ...prev,
                            [activeHookTab!]: { ...prev[activeHookTab!], editedPrompt: e.target.value },
                          }))
                        }}
                        rows={3}
                        className="font-mono text-[11px] leading-relaxed text-foreground/70 resize-none overflow-hidden pr-8"
                      />
                      {activeHookConfig?.editedPrompt !== null && activeHookConfig?.editedPrompt !== undefined && (
                        <button
                          type="button"
                          onClick={() => {
                            setPerHookConfig((prev) => ({
                              ...prev,
                              [activeHookTab!]: { ...prev[activeHookTab!], editedPrompt: null },
                            }))
                          }}
                          className="absolute top-2 right-2 p-1 rounded text-muted-foreground/50 hover:text-primary transition-colors"
                          title="Reset to original"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
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

        {/* ═══ PINNED BOTTOM: Duration + Generate ═══ */}
        <div className="shrink-0 border-t border-border/30 pt-4 mt-2 space-y-3 bg-card">
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
