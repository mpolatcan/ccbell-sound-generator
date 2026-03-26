import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, X } from 'lucide-react'
import type { HookType, HookTypeId } from '@/types'
import { cn } from '@/lib/utils'
import { HOOK_TYPE_COLORS } from '@/lib/constants'

interface HookSelectorProps {
  hooks: HookType[]
  selectedHooks: HookTypeId[]
  onSelect: (hookIds: HookTypeId[]) => void
}

export const HookSelector = memo(function HookSelector({ hooks, selectedHooks, onSelect }: HookSelectorProps) {
  const selectedHooksData = hooks.filter(h => selectedHooks.includes(h.id))

  const toggleHook = (hookId: HookTypeId) => {
    if (selectedHooks.includes(hookId)) {
      onSelect(selectedHooks.filter(id => id !== hookId))
    } else {
      onSelect([...selectedHooks, hookId])
    }
  }

  const removeHook = (hookId: HookTypeId, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(selectedHooks.filter(id => id !== hookId))
  }

  const selectAll = () => {
    onSelect(hooks.map(h => h.id))
  }

  const clearAll = () => {
    onSelect([])
  }

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-auto min-h-10",
              selectedHooks.length === 0 && "text-muted-foreground"
            )}
          >
            <div className="flex flex-wrap gap-1 py-1">
              {selectedHooks.length === 0 ? (
                <span>Select hook types...</span>
              ) : selectedHooks.length <= 3 ? (
                selectedHooksData.map((hook) => (
                  <Badge
                    key={hook.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {hook.name}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => removeHook(hook.id, e)}
                    />
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">
                  {selectedHooks.length} hooks selected
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center justify-between p-2 border-b">
            <span className="text-sm font-medium">Select Hook Types</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 rounded-full border border-border/50 player-btn px-2.5 text-xs">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 rounded-full border border-border/50 hover-glow-destructive px-2.5 text-xs">
                Clear
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-2 space-y-1">
              {hooks.map((hook) => (
                <div
                  key={hook.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-md cursor-pointer transition-all duration-200",
                    "hover:bg-primary/8 hover:shadow-[0_0_10px_-4px_hsl(30_85%_54%/0.25)]",
                    selectedHooks.includes(hook.id)
                      ? "bg-primary/6 border border-primary/20"
                      : "border border-transparent"
                  )}
                  onClick={() => toggleHook(hook.id)}
                >
                  <Checkbox
                    checked={selectedHooks.includes(hook.id)}
                    onCheckedChange={() => toggleHook(hook.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', HOOK_TYPE_COLORS[hook.id]?.dot || 'bg-primary')} />
                      {hook.name}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {hook.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedHooksData.length > 3 && (
        <p className="text-xs text-muted-foreground">
          {selectedHooksData.length} hooks selected - sounds will be generated sequentially
        </p>
      )}
    </div>
  )
})
