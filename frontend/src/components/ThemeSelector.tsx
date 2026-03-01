import { memo } from 'react'
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
  Pencil
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {themes.map((theme) => {
          const Icon = iconMap[theme.icon] || Minus
          const isSelected = selectedTheme === theme.id

          return (
            <button
              key={theme.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                'border cursor-pointer transition-all duration-200 ease-out',
                isSelected
                  ? 'border-primary/60 bg-primary/12 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/20'
                  : 'border-border/50 bg-muted/15 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/30'
              )}
              onClick={() => onSelect(theme.id)}
              aria-pressed={isSelected}
            >
              <Icon className={cn("h-3.5 w-3.5 transition-transform duration-200", isSelected && "scale-110")} />
              {theme.name}
            </button>
          )
        })}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">{selected.description}</p>
      )}
    </div>
  )
})
