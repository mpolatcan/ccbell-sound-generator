import { memo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { HookType, HookTypeId } from '@/types'
import { HOOK_TYPE_COLORS } from '@/lib/constants'

interface HookConfigTabsProps {
  hooks: HookType[]
  selectedHooks: HookTypeId[]
  activeTab: HookTypeId | null
  onTabChange: (hookId: HookTypeId) => void
}

export const HookConfigTabs = memo(function HookConfigTabs({
  hooks,
  selectedHooks,
  activeTab,
  onTabChange,
}: HookConfigTabsProps) {
  if (selectedHooks.length === 0) return null

  const selectedHooksData = selectedHooks
    .map((id) => hooks.find((h) => h.id === id))
    .filter((h): h is HookType => h !== undefined)

  const activeHookData = selectedHooksData.find((h) => h.id === activeTab)

  return (
    <Select
      value={activeTab ?? undefined}
      onValueChange={(value) => onTabChange(value as HookTypeId)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select hook to configure">
          {activeHookData && (
            <span className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', HOOK_TYPE_COLORS[activeHookData.id]?.dot || 'bg-primary')} />
              <span>{activeHookData.name}</span>
              <span className="text-muted-foreground text-xs ml-1">
                ({selectedHooksData.length} selected)
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {selectedHooksData.map((hook) => (
          <SelectItem key={hook.id} value={hook.id}>
            <span className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', HOOK_TYPE_COLORS[hook.id]?.dot || 'bg-primary')} />
              <span>{hook.name}</span>
              <span className="text-muted-foreground text-xs">
                - {hook.description}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
