import { memo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <Tabs
      value={activeTab ?? undefined}
      onValueChange={(value) => onTabChange(value as HookTypeId)}
    >
      <TabsList className="flex-wrap h-auto gap-1 bg-muted/30 p-1">
        {selectedHooksData.map((hook) => (
          <TabsTrigger key={hook.id} value={hook.id} className="text-sm">
            {hook.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
})
