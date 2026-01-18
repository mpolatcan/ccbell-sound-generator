import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import type { ModelLoadingStatusType } from '@/types'

interface ModelLoadingIndicatorProps {
  status: ModelLoadingStatusType
  progress: number
  stage: string | null
  error: string | null
  modelName: string
  onRetry?: () => void
}

const stageLabels: Record<string, string> = {
  initializing: 'Initializing...',
  downloading: 'Downloading model...',
  loading_weights: 'Loading model weights...',
  moving_to_device: 'Preparing model...',
  complete: 'Ready'
}

export function ModelLoadingIndicator({
  status,
  progress,
  stage,
  error,
  modelName,
  onRetry
}: ModelLoadingIndicatorProps) {
  if (status === 'ready') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-4 w-4" />
        <span>{modelName} ready</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive text-sm">Failed to load {modelName}</h4>
            <p className="text-xs text-muted-foreground mt-1 break-words">
              {error || 'An unknown error occurred'}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="font-medium">Loading {modelName}</span>
        </div>
        <Progress value={progress * 100} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {stage ? stageLabels[stage] || stage : 'Please wait...'} ({Math.round(progress * 100)}%)
        </p>
      </div>
    )
  }

  // Idle state
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Preparing {modelName}...</span>
    </div>
  )
}
