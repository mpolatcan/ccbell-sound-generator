import { memo, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      {/* Prompt variant list */}
      <div className="space-y-1">
        {prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              'w-full text-left px-3 py-1.5 rounded-md text-xs transition-all duration-200',
              'border cursor-pointer',
              i === selectedIndex
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-transparent bg-muted/15 text-muted-foreground hover:bg-muted/30 hover:text-foreground'
            )}
            onClick={() => {
              if (i !== selectedIndex) {
                onSelectIndex(i)
                onEditPrompt(null)
              }
            }}
          >
            <span className="flex items-center gap-2">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-200',
                i === selectedIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              )} />
              <span className="truncate">{prompt.label}</span>
            </span>
          </button>
        ))}
      </div>

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
