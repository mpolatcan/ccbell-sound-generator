import { useState, memo } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditablePromptChips, ChipItem } from '@/types'

interface PromptComponentsEditorProps {
  chips: EditablePromptChips
  onChange: (chips: EditablePromptChips) => void
  assembledPrompt: string
}

const CATEGORIES: { key: keyof EditablePromptChips; label: string }[] = [
  { key: 'sound_type', label: 'Sound Type' },
  { key: 'style', label: 'Style' },
  { key: 'instruments', label: 'Instruments' },
  { key: 'mood', label: 'Mood' },
  { key: 'quality', label: 'Quality' },
]

const ChipRow = memo(function ChipRow({
  label,
  items,
  onToggle,
  onAdd,
  onRemove,
}: {
  label: string
  items: ChipItem[]
  onToggle: (index: number) => void
  onAdd: (value: string) => void
  onRemove: (index: number) => void
}) {
  const [newValue, setNewValue] = useState('')

  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (trimmed && !items.some((item) => item.label.toLowerCase() === trimmed.toLowerCase())) {
      onAdd(trimmed)
    }
    setNewValue('')
  }

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-wrap gap-1.5 items-center">
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all',
              'border cursor-pointer',
              item.enabled
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground line-through opacity-60'
            )}
            onClick={() => onToggle(index)}
          >
            {item.label}
            {item.isCustom && (
              <X
                className="h-3 w-3 ml-0.5 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
              />
            )}
          </button>
        ))}
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Add..."
          className="h-5 w-20 px-1.5 text-xs border border-dashed border-muted-foreground/30 rounded-full bg-transparent outline-none focus:border-primary focus:w-28 transition-all placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  )
})

export const PromptComponentsEditor = memo(function PromptComponentsEditor({
  chips,
  onChange,
  assembledPrompt,
}: PromptComponentsEditorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (category: keyof EditablePromptChips, index: number) => {
    const updated = [...chips[category]]
    updated[index] = { ...updated[index], enabled: !updated[index].enabled }
    onChange({ ...chips, [category]: updated })
  }

  const handleAdd = (category: keyof EditablePromptChips, value: string) => {
    const updated = [...chips[category], { label: value, enabled: true, isCustom: true }]
    onChange({ ...chips, [category]: updated })
  }

  const handleRemove = (category: keyof EditablePromptChips, index: number) => {
    const updated = chips[category].filter((_, i) => i !== index)
    onChange({ ...chips, [category]: updated })
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
          {CATEGORIES.map(({ key, label }) => (
            <ChipRow
              key={key}
              label={label}
              items={chips[key]}
              onToggle={(index) => handleToggle(key, index)}
              onAdd={(value) => handleAdd(key, value)}
              onRemove={(index) => handleRemove(key, index)}
            />
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
})
