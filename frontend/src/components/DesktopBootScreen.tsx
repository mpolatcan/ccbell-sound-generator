import { Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DesktopBootScreenProps {
  stage: string
  error: string | null
  onRetry: () => void
}

export function DesktopBootScreen({ stage, error, onRetry }: DesktopBootScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <h1 className="text-2xl font-bold font-display">CCBell Sound Generator</h1>

        {error ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Setup Failed</span>
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">{stage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
