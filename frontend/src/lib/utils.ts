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

const STOPWORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up', 'into', 'through'])

/** Return a short display alias for a prompt entry. Uses alias if present, otherwise truncates text to ~5 words. */
export function getPromptAlias(prompt: { text: string; alias?: string }): string {
  if (prompt.alias) return prompt.alias
  const words = prompt.text.split(/\s+/)
  const sliced = words.slice(0, 5)
  // Trim trailing stopwords
  while (sliced.length > 1 && STOPWORDS.has(sliced[sliced.length - 1].toLowerCase())) {
    sliced.pop()
  }
  return sliced.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function downloadUrl(url: string, filename: string) {
  const response = await fetch(url)
  const blob = await response.blob()
  downloadBlob(blob, filename)
}
