import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

// Predefined shortcuts info for help display
export const KEYBOARD_SHORTCUTS = [
  { keys: 'G', description: 'Generate sound' },
  { keys: 'Ctrl+D', description: 'Download ZIP' },
  { keys: 'C', description: 'Clear library' },
  { keys: '?', description: 'Show shortcuts help' },
] as const
