import { memo, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RotateCcw } from 'lucide-react'
import { getPromptAlias } from '@/lib/utils'
import type { PromptEntry } from '@/types'

interface PromptVariantSelectorProps {
  prompts: PromptEntry[]
  selectedIndex: number
  editedPrompt: string | null
  duration: number
  onSelectIndex: (index: number) => void
  onEditPrompt: (text: string | null) => void
}

export const PromptVariantSelector = memo(function PromptVariantSelector({
  prompts,
  selectedIndex,
  editedPrompt,
  duration,
  onSelectIndex,
  onEditPrompt,
}: PromptVariantSelectorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selected = prompts[selectedIndex]
  const fullOriginal = selected ? `${selected.text}, ${duration} seconds` : ''
  const displayText = editedPrompt ?? fullOriginal

  // Auto-resize textarea to fit content
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [displayText])

  if (prompts.length === 0) return null

  return (
    <div className="space-y-2.5">
      {/* Prompt variant dropdown */}
      <Select
        value={String(selectedIndex)}
        onValueChange={(value) => {
          const idx = Number(value)
          if (idx !== selectedIndex) {
            onSelectIndex(idx)
            onEditPrompt(null)
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a prompt variant..." />
        </SelectTrigger>
        <SelectContent>
          {prompts.map((prompt, i) => (
            <SelectItem key={i} value={String(i)}>
              {getPromptAlias(prompt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Editable prompt textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => onEditPrompt(e.target.value)}
          rows={3}
          className="font-mono text-[11px] leading-relaxed text-foreground/70 resize-none overflow-hidden pr-8"
        />
        {editedPrompt !== null && (
          <button
            type="button"
            onClick={() => onEditPrompt(null)}
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground/50 hover:text-primary transition-colors"
            title="Reset to original"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
})
