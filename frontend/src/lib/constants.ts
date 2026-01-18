// API base URL - empty string for same-origin requests
export const API_BASE_URL = ''

// WebSocket URL
export const WS_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  : ''

// Model defaults
export const MODEL_DEFAULTS = {
  small: {
    default_steps: 8,
    cfg_scale: 1.0,
    default_sampler: 'pingpong',
    max_duration: 11
  },
  '1.0': {
    default_steps: 100,
    cfg_scale: 1.0,
    default_sampler: 'dpmpp-3m-sde',
    max_duration: 47
  }
} as const

// Default generation settings
export const DEFAULT_DURATION = 2.0

// Sampler options
export const SAMPLER_OPTIONS = [
  { value: 'pingpong', label: 'Pingpong (Fast)' },
  { value: 'dpmpp-3m-sde', label: 'DPM++ 3M SDE' },
  { value: 'dpmpp-2m-sde', label: 'DPM++ 2M SDE' },
  { value: 'k_heun', label: 'Heun' },
  { value: 'k_euler', label: 'Euler' },
  { value: 'k_euler_a', label: 'Euler Ancestral' }
] as const
