import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { HookType } from '@/types'
import { formatDuration } from '@/lib/utils'

interface HookSelectorProps {
  hooks: HookType[]
  selectedHook: string
  onSelect: (hookId: string) => void
}

export function HookSelector({ hooks, selectedHook, onSelect }: HookSelectorProps) {
  const selectedHookData = hooks.find(h => h.id === selectedHook)

  return (
    <div className="space-y-2">
      <Select value={selectedHook} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a hook type" />
        </SelectTrigger>
        <SelectContent>
          {hooks.map((hook) => (
            <SelectItem key={hook.id} value={hook.id}>
              <div className="flex items-center gap-2">
                <span>{hook.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(hook.suggested_duration)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedHookData && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{selectedHookData.description}</p>
          <p className="italic text-xs">
            Sound character: {selectedHookData.sound_character}
          </p>
        </div>
      )}
    </div>
  )
}
