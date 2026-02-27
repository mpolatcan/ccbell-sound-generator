import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { getSamplersForModel, MODEL_DEFAULTS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Info, Zap, Gem, Scale, RotateCcw, SlidersHorizontal } from 'lucide-react'
import type { GenerationSettings } from '@/types'

interface AdvancedSettingsProps {
  model: 'small' | '1.0'
  settings: GenerationSettings
  onChange: (settings: GenerationSettings) => void
}

// Presets for different use cases
// Note: Small model ONLY supports 'pingpong' sampler
const PRESETS = {
  fast: {
    name: 'Fast',
    description: 'Quick generation, good for testing',
    icon: Zap,
    settings: {
      small: { steps: 4, cfg_scale: 1.0, sampler: 'pingpong' },
      '1.0': { steps: 40, cfg_scale: 3.0, sampler: 'dpmpp-3m-sde' }
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good quality with reasonable speed',
    icon: Scale,
    settings: {
      small: { steps: 8, cfg_scale: 1.0, sampler: 'pingpong' },
      '1.0': { steps: 100, cfg_scale: 7.0, sampler: 'dpmpp-3m-sde' }
    }
  },
  quality: {
    name: 'Quality',
    description: 'Higher quality, longer generation time',
    icon: Gem,
    settings: {
      small: { steps: 12, cfg_scale: 1.5, sampler: 'pingpong' },
      '1.0': { steps: 150, cfg_scale: 9.0, sampler: 'dpmpp-3m-sde' }
    }
  }
} as const


export function AdvancedSettings({ model, settings, onChange }: AdvancedSettingsProps) {
  const defaults = MODEL_DEFAULTS[model]

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
    const presetSettings = preset.settings[model]
    onChange({
      ...settings,
      steps: presetSettings.steps,
      cfg_scale: presetSettings.cfg_scale,
      sampler: presetSettings.sampler
    })
  }

  const resetToDefaults = () => {
    onChange({})
  }

  const currentSampler = settings.sampler ?? defaults.default_sampler
  const currentSteps = settings.steps ?? defaults.default_steps
  const currentCfgScale = settings.cfg_scale ?? defaults.cfg_scale
  const availableSamplers = getSamplersForModel(model)

  const activePreset = useMemo(() => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      const p = preset.settings[model]
      if (
        currentSteps === p.steps &&
        currentCfgScale === p.cfg_scale &&
        currentSampler === p.sampler
      ) {
        return key as keyof typeof PRESETS
      }
    }
    return null
  }, [model, currentSteps, currentCfgScale, currentSampler])

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Advanced Settings
              </CardTitle>
              <CardDescription>Fine-tune audio generation parameters</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Presets
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Quick configurations for different use cases. These adjust steps, CFG scale, and sampler together.</p>
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
                            ? "ring-2 ring-primary shadow-md shadow-primary/25 scale-[1.02]"
                            : "opacity-75 hover:opacity-100"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        {preset.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{preset.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Steps: {preset.settings[model].steps}, CFG: {preset.settings[model].cfg_scale}
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
                      For the small model, 4-16 steps work well. For 1.0 model, 80-150 is optimal.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Badge variant="secondary">{currentSteps}</Badge>
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
              <Badge variant="secondary">{currentCfgScale.toFixed(1)}</Badge>
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

          {/* Sampler */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Sampler
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">The algorithm used to denoise:</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>Pingpong</strong> - Only option for small model</li>
                    <li><strong>DPM++ 3M SDE</strong> - Best quality for 1.0</li>
                    <li><strong>DPM++ 2M SDE</strong> - Faster for 1.0</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </Label>
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
            {model === 'small' && (
              <p className="text-xs text-primary/70">
                Small model only supports Pingpong sampler
              </p>
            )}
          </div>

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
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
