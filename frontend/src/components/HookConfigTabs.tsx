import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { HookType, HookTypeId } from '@/types'

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

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-nowrap gap-2">
        {selectedHooksData.map((hook) => (
          <button
            key={hook.id}
            type="button"
            className={cn(
              'whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-all border cursor-pointer',
              activeTab === hook.id
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
            onClick={() => onTabChange(hook.id)}
          >
            {hook.name}
          </button>
        ))}
      </div>
    </div>
  )
})
