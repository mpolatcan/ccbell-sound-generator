import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { ThemePreset } from '@/types'
import {
  Rocket,
  Gamepad2,
  Leaf,
  Minus,
  Cog,
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
  'pencil': Pencil
}

export function ThemeSelector({ themes, selectedTheme, onSelect }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {themes.map((theme) => {
        const Icon = iconMap[theme.icon] || Minus
        const isSelected = selectedTheme === theme.id

        return (
          <Card
            key={theme.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              isSelected && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => onSelect(theme.id)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Icon
                className={cn(
                  'h-8 w-8 mb-2',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <h4 className="font-medium text-sm">{theme.name}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {theme.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
