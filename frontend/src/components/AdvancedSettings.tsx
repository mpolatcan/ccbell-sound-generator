import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { SAMPLER_OPTIONS, MODEL_DEFAULTS } from '@/lib/constants'
import type { GenerationSettings } from '@/types'

interface AdvancedSettingsProps {
  model: 'small' | '1.0'
  settings: GenerationSettings
  onChange: (settings: GenerationSettings) => void
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

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="advanced">
        <AccordionTrigger>Advanced Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-2">
            {/* Steps */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Diffusion Steps</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.steps ?? defaults.default_steps}
                </span>
              </div>
              <Slider
                value={[settings.steps ?? defaults.default_steps]}
                onValueChange={handleStepsChange}
                min={1}
                max={200}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                More steps = higher quality but slower. Default: {defaults.default_steps}
              </p>
            </div>

            {/* CFG Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>CFG Scale</Label>
                <span className="text-sm text-muted-foreground">
                  {(settings.cfg_scale ?? defaults.cfg_scale).toFixed(1)}
                </span>
              </div>
              <Slider
                value={[settings.cfg_scale ?? defaults.cfg_scale]}
                onValueChange={handleCfgScaleChange}
                min={0}
                max={15}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Higher values = stronger prompt adherence. Default: {defaults.cfg_scale}
              </p>
            </div>

            {/* Sampler */}
            <div className="space-y-2">
              <Label>Sampler</Label>
              <Select
                value={settings.sampler ?? defaults.default_sampler}
                onValueChange={handleSamplerChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default: {defaults.default_sampler}
              </p>
            </div>

            {/* Seed */}
            <div className="space-y-2">
              <Label>Seed (optional)</Label>
              <Input
                type="number"
                placeholder="Random"
                value={settings.seed ?? ''}
                onChange={handleSeedChange}
              />
              <p className="text-xs text-muted-foreground">
                Set a seed for reproducible results
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
