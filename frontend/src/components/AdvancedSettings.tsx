import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Info, Zap, Gem, Scale, RotateCcw } from 'lucide-react'
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
      '1.0': { steps: 50, cfg_scale: 1.0, sampler: 'dpmpp-3m-sde' }
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good quality with reasonable speed',
    icon: Scale,
    settings: {
      small: { steps: 8, cfg_scale: 1.0, sampler: 'pingpong' },
      '1.0': { steps: 100, cfg_scale: 1.0, sampler: 'dpmpp-3m-sde' }
    }
  },
  quality: {
    name: 'Quality',
    description: 'Higher quality, longer generation time',
    icon: Gem,
    settings: {
      // Small model only supports pingpong, so we increase steps instead
      small: { steps: 16, cfg_scale: 1.5, sampler: 'pingpong' },
      '1.0': { steps: 150, cfg_scale: 2.0, sampler: 'dpmpp-3m-sde' }
    }
  }
} as const

// Detailed descriptions for each sampler
const SAMPLER_DESCRIPTIONS: Record<string, string> = {
  'pingpong': 'The only sampler for small model. Very fast with good quality for short sounds. Optimized for quick generation.',
  'dpmpp-3m-sde': 'Best quality for 1.0 model. Uses 3rd order multistep method with stochastic differential equations. Excellent detail and clarity.',
  'dpmpp-2m-sde': 'Faster option for 1.0 model. Uses 2nd order multistep with SDE noise. Good balance of speed and quality.'
}

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

  return (
    <TooltipProvider>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {/* Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
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
                <div className="flex gap-2">
                  {Object.entries(PRESETS).map(([key, preset]) => {
                    const Icon = preset.icon
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyPreset(key as keyof typeof PRESETS)}
                            className="flex-1"
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
                  Controls how many denoising iterations to run. Higher = better quality but slower.
                  Default: {defaults.default_steps}
                </p>
              </div>

              {/* CFG Scale */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    CFG Scale (Classifier-Free Guidance)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium mb-1">How it affects the output:</p>
                        <ul className="text-xs space-y-1">
                          <li><strong>Low (0-1)</strong> = More creative/random results, may not match prompt well</li>
                          <li><strong>Medium (1-3)</strong> = Good balance between creativity and prompt adherence</li>
                          <li><strong>High (3+)</strong> = Strongly follows the prompt, but may sound artificial or over-saturated</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          For notification sounds, 1.0-2.0 typically works best.
                        </p>
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
                  How strongly the generation follows your prompt. Higher = more literal interpretation.
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
                        <li><strong>Pingpong</strong> - Only option for small model, very fast</li>
                        <li><strong>DPM++ 3M SDE</strong> - Best quality for 1.0 model</li>
                        <li><strong>DPM++ 2M SDE</strong> - Faster option for 1.0 model</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        Each model has specific compatible samplers. The options shown are filtered for your selected model.
                      </p>
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
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {model === 'small' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Note: Small model only supports Pingpong sampler
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {SAMPLER_DESCRIPTIONS[currentSampler] || `Default: ${defaults.default_sampler}`}
                </p>
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
                        <li><strong>Empty</strong> = Random seed each time (different results)</li>
                        <li><strong>Same seed + same settings</strong> = Identical audio output</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        Useful when you want to tweak other settings while keeping the same "starting point" for generation.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  type="number"
                  placeholder="Random (leave empty)"
                  value={settings.seed ?? ''}
                  onChange={handleSeedChange}
                />
                <p className="text-xs text-muted-foreground">
                  Set a specific seed to reproduce the exact same sound. Leave empty for random variation each time.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </TooltipProvider>
  )
}
