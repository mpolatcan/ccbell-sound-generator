import { memo, useRef, useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState, selectedHooks])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.6
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (selectedHooks.length === 0) return null

  const selectedHooksData = selectedHooks
    .map((id) => hooks.find((h) => h.id === id))
    .filter((h): h is HookType => h !== undefined)

  return (
    <Tabs
      value={activeTab ?? undefined}
      onValueChange={(value) => onTabChange(value as HookTypeId)}
    >
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={() => scroll('left')}
          className={cn(
            'shrink-0 flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted/50 text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground cursor-pointer',
            canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-none flex-1"
        >
          <TabsList className="inline-flex w-max bg-muted/30 p-1">
            {selectedHooksData.map((hook) => (
              <TabsTrigger key={hook.id} value={hook.id} className="text-sm gap-1.5">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', HOOK_TYPE_COLORS[hook.id]?.dot || 'bg-primary')} />
                {hook.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'shrink-0 flex items-center justify-center h-8 w-8 rounded-md border border-border bg-muted/50 text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground cursor-pointer',
            canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Tabs>
  )
})
