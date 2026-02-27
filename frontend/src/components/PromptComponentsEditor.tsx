import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePromptComponents } from '@/types'

interface PromptComponentsEditorProps {
  components: EditablePromptComponents
  onChange: (components: EditablePromptComponents) => void
  assembledPrompt: string
}

const FIELDS: { key: keyof EditablePromptComponents; label: string; placeholder: string }[] = [
  { key: 'sound_type', label: 'Sound Type', placeholder: 'e.g. completion chime, resolution tone' },
  { key: 'style', label: 'Style', placeholder: 'e.g. sci-fi, futuristic, digital' },
  { key: 'instruments', label: 'Instruments', placeholder: 'e.g. digital synthesizer, oscillator' },
  { key: 'mood', label: 'Mood', placeholder: 'e.g. technological, clean, precise' },
  { key: 'quality', label: 'Quality', placeholder: 'e.g. 44.1kHz, stereo, high-quality' },
]

export function PromptComponentsEditor({
  components,
  onChange,
  assembledPrompt,
}: PromptComponentsEditorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateField = (field: keyof EditablePromptComponents, value: string) => {
    onChange({ ...components, [field]: value })
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 w-full text-sm font-medium text-muted-foreground",
              "hover:text-foreground transition-colors"
            )}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Settings2 className="h-4 w-4" />
            Prompt Components
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={components[key]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className="h-8 text-sm"
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {assembledPrompt && (
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Generated Prompt</Label>
          <p className="text-xs bg-muted/50 py-2 px-3 rounded-md break-words">
            {assembledPrompt}
          </p>
        </div>
      )}
    </div>
  )
}
