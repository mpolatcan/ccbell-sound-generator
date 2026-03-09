import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ModelLoadingIndicator } from './ModelLoadingIndicator'
import { getSamplersForModel, MODEL_DEFAULTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Info, Zap, Gem, Scale, RotateCcw, Cpu } from 'lucide-react'
import type { GenerationSettings } from '@/types'
import type { UseModelStatusReturn } from '@/hooks/useModelStatus'

interface ModelSettingsProps {
  model: string
  onModelChange: (model: string) => void
  modelStatus: UseModelStatusReturn
  settings: GenerationSettings
  onChange: (settings: GenerationSettings) => void
}

// Presets for different use cases
const PRESETS = {
  fast: {
    name: 'Fast',
    description: 'Decent quality (~1 min)',
    icon: Zap,
    settings: { steps: 8, cfg_scale: 1.0, sampler: 'pingpong' }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good quality (~1.5 min)',
    icon: Scale,
    settings: { steps: 16, cfg_scale: 2.0, sampler: 'pingpong' }
  },
  quality: {
    name: 'Quality',
    description: 'Best quality (~2 min)',
    icon: Gem,
    settings: { steps: 25, cfg_scale: 3.0, sampler: 'pingpong' }
  }
} as const


export function ModelSettings({ model, onModelChange, modelStatus, settings, onChange }: ModelSettingsProps) {
  const defaults = MODEL_DEFAULTS[model]

  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: api.getModels,
    retry: 2
  })

  const handleStepsChange = (value: number[]) => {
    onChange({ ...settings, steps: value[0] })
  }

  const handleCfgScaleChange = (value: number[]) => {
    onChange({ ...settings, cfg_scale: value[0] })
  }

  const handleSamplerChange = (value: string) => {
    onChange({ ...settings, sampler: value })
  }

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onChange({
      ...settings,
      seed: value ? parseInt(value, 10) : undefined
    })
  }

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey]
    onChange({
      ...settings,
      steps: preset.settings.steps,
      cfg_scale: preset.settings.cfg_scale,
      sampler: preset.settings.sampler
    })
  }

  const resetToDefaults = () => {
    onChange({})
  }

  const currentSampler = settings.sampler ?? defaults.default_sampler
  const currentSteps = settings.steps ?? defaults.default_steps
  const currentCfgScale = settings.cfg_scale ?? defaults.cfg_scale
  const availableSamplers = getSamplersForModel(model)
  const currentModel = models.find(m => m.id === model)

  const activePreset = useMemo(() => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      const p = preset.settings
      if (
        currentSteps === p.steps &&
        currentCfgScale === p.cfg_scale &&
        currentSampler === p.sampler
      ) {
        return key as keyof typeof PRESETS
      }
    }
    return null
  }, [currentSteps, currentCfgScale, currentSampler])

  return (
    <TooltipProvider>
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Model Settings
              </CardTitle>
              <CardDescription>Fine-tune generation parameters</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Reset to defaults"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Model & Sampler info */}
          {modelsLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : models.length > 1 ? (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={onModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col">
                        <span>{m.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.parameters} &middot; Max {m.max_duration}s
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : currentModel ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{currentModel.name}</span>
              <span>&middot;</span>
              <span>{currentModel.parameters}</span>
              <span>&middot;</span>
              <span>Sampler: {currentSampler}</span>
            </div>
          ) : null}

          {/* Model Loading Status */}
          <ModelLoadingIndicator
            status={modelStatus.status}
            progress={modelStatus.progress}
            stage={modelStatus.stage}
            error={modelStatus.error}
            modelName={currentModel?.name || model}
            onRetry={modelStatus.loadModel}
          />

          {/* Presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Presets
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Quick configurations for different use cases. These adjust steps and CFG scale together.</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="flex gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => {
                const Icon = preset.icon
                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={activePreset === key ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyPreset(key as keyof typeof PRESETS)}
                        className={cn(
                          "flex-1 transition-all duration-200",
                          activePreset === key
                            ? "ring-1 ring-primary/50 shadow-md shadow-primary/15"
                            : "opacity-70 hover:opacity-100"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        {preset.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Steps: {preset.settings.steps}, CFG: {preset.settings.cfg_scale}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            {activePreset === null && (
              <p className="text-xs text-muted-foreground italic">Custom settings</p>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                Diffusion Steps
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">How it affects quality:</p>
                    <ul className="text-xs space-y-1">
                      <li><strong>More steps (higher)</strong> = Finer details, cleaner audio, but slower generation</li>
                      <li><strong>Fewer steps (lower)</strong> = Faster generation, but may sound rougher or have artifacts</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      For notification sounds, 4-16 steps work well. Default: 8 steps.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Badge variant="secondary" className="font-mono tabular-nums">{currentSteps}</Badge>
            </div>
            <Slider
              value={[currentSteps]}
              onValueChange={handleStepsChange}
              min={1}
              max={200}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Default: {defaults.default_steps}
            </p>
          </div>

          {/* CFG Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                CFG Scale
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">How it affects the output:</p>
                    <ul className="text-xs space-y-1">
                      <li><strong>Low (0-1)</strong> = More creative/random results</li>
                      <li><strong>Medium (1-3)</strong> = Good balance</li>
                      <li><strong>High (3+)</strong> = Strongly follows prompt</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Badge variant="secondary" className="font-mono tabular-nums">{currentCfgScale.toFixed(1)}</Badge>
            </div>
            <Slider
              value={[currentCfgScale]}
              onValueChange={handleCfgScaleChange}
              min={0}
              max={15}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">
              Default: {defaults.cfg_scale}
            </p>
          </div>

          {/* Sampler - only show dropdown if multiple options */}
          {availableSamplers.length > 1 && (
            <div className="space-y-2">
              <Label>Sampler</Label>
              <Select
                value={currentSampler}
                onValueChange={handleSamplerChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableSamplers.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seed */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Seed (optional)
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">For reproducible results:</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>Empty</strong> = Random seed each time</li>
                    <li><strong>Same seed + settings</strong> = Identical output</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              type="number"
              placeholder="Random (leave empty)"
              value={settings.seed ?? ''}
              onChange={handleSeedChange}
              className="font-mono placeholder:text-muted-foreground/50"
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
