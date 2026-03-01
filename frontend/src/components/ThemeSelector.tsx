import { memo, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { ThemePreset } from '@/types'
import {
  Rocket,
  Gamepad2,
  Leaf,
  Minus,
  Cog,
  Cloud,
  Music,
  Pencil,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface ThemeSelectorProps {
  themes: ThemePreset[]
  selectedTheme: string
  onSelect: (themeId: string) => void
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'rocket': Rocket,
  'gamepad-2': Gamepad2,
  'leaf': Leaf,
  'minus': Minus,
  'cog': Cog,
  'cloud': Cloud,
  'music': Music,
  'pencil': Pencil
}

export const ThemeSelector = memo(function ThemeSelector({ themes, selectedTheme, onSelect }: ThemeSelectorProps) {
  const selected = themes.find((t) => t.id === selectedTheme)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  return (
    <div className="space-y-2">
      <div className="relative group/themes">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card/90 border border-border/50 flex items-center justify-center opacity-0 group-hover/themes:opacity-100 transition-opacity shadow-sm cursor-pointer"
          aria-label="Scroll themes left"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-none px-1 py-0.5 theme-scroll-strip"
        >
          {themes.map((theme) => {
            const Icon = iconMap[theme.icon] || Minus
            const isSelected = selectedTheme === theme.id

            return (
              <button
                key={theme.id}
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-full text-sm font-medium shrink-0',
                  'border cursor-pointer transition-all duration-300 ease-out',
                  isSelected
                    ? 'border-primary/60 bg-primary/12 text-primary shadow-md shadow-primary/15 scale-[1.03]'
                    : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/40 hover:scale-[1.01]'
                )}
                onClick={() => onSelect(theme.id)}
                aria-pressed={isSelected}
              >
                <Icon className={cn("h-3.5 w-3.5 transition-transform duration-300", isSelected && "scale-110")} />
                {theme.name}
              </button>
            )
          })}
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-card/90 border border-border/50 flex items-center justify-center opacity-0 group-hover/themes:opacity-100 transition-opacity shadow-sm cursor-pointer"
          aria-label="Scroll themes right"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">{selected.description}</p>
      )}
    </div>
  )
})
