import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcuts = [
  { keys: ['G'], description: 'Generate sound (when form is valid)' },
  { keys: ['Ctrl', 'D'], description: 'Download all sounds as ZIP' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Clear sound library' },
  { keys: ['?'], description: 'Show this help dialog' },
  { keys: ['Esc'], description: 'Close dialogs' },
]

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-muted-foreground">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1 py-0.5 text-xs bg-muted border rounded">?</kbd> anytime to show this help
        </p>
      </DialogContent>
    </Dialog>
  )
}
