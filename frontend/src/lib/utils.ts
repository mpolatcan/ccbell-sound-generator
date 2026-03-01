import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`
  }
  return `${secs}.${ms}s`
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'idle': 'Ready',
    'loading_model': 'Loading model...',
    'preparing': 'Preparing...',
    'generating': 'Generating audio...',
    'processing_audio': 'Processing audio...',
    'saving': 'Saving...',
    'complete': 'Complete!',
    'error': 'Error',
    'queued': 'Queued...'
  }
  return labels[stage] || stage
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadUrl(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  downloadBlob(blob, filename)
}
