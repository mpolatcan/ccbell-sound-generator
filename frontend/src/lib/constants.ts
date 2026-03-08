// Detect Tauri desktop environment
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// API base URL - in Tauri mode, point to the local sidecar backend
export const API_BASE_URL = isTauri ? 'http://127.0.0.1:7860' : ''

// WebSocket URL - in Tauri mode, point to the local sidecar backend
export const WS_BASE_URL = isTauri
  ? 'ws://127.0.0.1:7860'
  : typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : ''

// Model defaults (optimized for short notification sounds on CPU)
export const MODEL_DEFAULTS: Record<string, {
  default_steps: number
  cfg_scale: number
  default_sampler: string
  max_duration: number
  sigma_min: number
  sigma_max: number
}> = {
  'stable-audio-open-small': {
    default_steps: 8,
    cfg_scale: 1.0,
    default_sampler: 'pingpong',
    max_duration: 5,
    sigma_min: 0.3,
    sigma_max: 500
  }
}

// Default generation settings
export const DEFAULT_DURATION = 1.0

// Sampler options per model
export const SAMPLER_OPTIONS = [
  { value: 'pingpong', label: 'Pingpong', models: ['stable-audio-open-small'] as const }
] as const

// Get samplers compatible with a model
export const getSamplersForModel = (model: string) => {
  return SAMPLER_OPTIONS.filter(s => (s.models as readonly string[]).includes(model))
}

// Hook type accent colors — used for left-border and dot indicators on sound cards
export const HOOK_TYPE_COLORS: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  Stop:              { border: 'border-l-emerald-500', bg: 'bg-emerald-500/8',  text: 'text-emerald-400', dot: 'bg-emerald-500' },
  SubagentStop:      { border: 'border-l-teal-500',    bg: 'bg-teal-500/8',     text: 'text-teal-400',    dot: 'bg-teal-500' },
  PermissionPrompt:  { border: 'border-l-amber-500',   bg: 'bg-amber-500/8',    text: 'text-amber-400',   dot: 'bg-amber-500' },
  IdlePrompt:        { border: 'border-l-violet-500',  bg: 'bg-violet-500/8',   text: 'text-violet-400',  dot: 'bg-violet-500' },
  SessionStart:      { border: 'border-l-sky-500',     bg: 'bg-sky-500/8',      text: 'text-sky-400',     dot: 'bg-sky-500' },
  SessionEnd:        { border: 'border-l-indigo-500',  bg: 'bg-indigo-500/8',   text: 'text-indigo-400',  dot: 'bg-indigo-500' },
  PreToolUse:        { border: 'border-l-orange-500',  bg: 'bg-orange-500/8',   text: 'text-orange-400',  dot: 'bg-orange-500' },
  PostToolUse:       { border: 'border-l-rose-500',    bg: 'bg-rose-500/8',     text: 'text-rose-400',    dot: 'bg-rose-500' },
  SubagentStart:     { border: 'border-l-cyan-500',    bg: 'bg-cyan-500/8',     text: 'text-cyan-400',    dot: 'bg-cyan-500' },
  UserPromptSubmit:  { border: 'border-l-fuchsia-500', bg: 'bg-fuchsia-500/8',  text: 'text-fuchsia-400', dot: 'bg-fuchsia-500' },
} as const
