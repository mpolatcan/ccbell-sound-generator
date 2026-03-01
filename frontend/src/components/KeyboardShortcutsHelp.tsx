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
          <DialogTitle className="flex items-center gap-2 font-display">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to work faster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1 shrink-0">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex}>
                    <kbd className="px-2 py-1 text-[10px] font-mono font-medium bg-muted/60 border border-border/50 rounded shadow-sm">
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-0.5 text-muted-foreground/50">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted/60 border border-border/50 rounded">?</kbd> anytime to show this help
        </p>
      </DialogContent>
    </Dialog>
  )
}
