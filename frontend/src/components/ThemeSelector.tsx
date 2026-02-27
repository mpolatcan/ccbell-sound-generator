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
      <div className="flex flex-wrap gap-2">
        {themes.map((theme) => {
          const Icon = iconMap[theme.icon] || Minus
          const isSelected = selectedTheme === theme.id

          return (
            <button
              key={theme.id}
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
              onClick={() => onSelect(theme.id)}
            >
              <Icon className="h-3.5 w-3.5" />
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
