// API base URL - empty string for same-origin requests
export const API_BASE_URL = ''

// WebSocket URL
export const WS_BASE_URL = typeof window !== 'undefined'
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  : ''

// Model defaults (from official HuggingFace documentation)
export const MODEL_DEFAULTS = {
  small: {
    default_steps: 8,
    cfg_scale: 1.0,
    default_sampler: 'pingpong',
    max_duration: 11,
    sigma_min: 0.3,
    sigma_max: 500
  },
  '1.0': {
    default_steps: 100,
    cfg_scale: 7.0,  // Official default is 7, not 1.0
    default_sampler: 'dpmpp-3m-sde',
    max_duration: 47,
    sigma_min: 0.3,
    sigma_max: 500
  }
} as const

// Default generation settings
export const DEFAULT_DURATION = 2.0

// Sampler options - model compatibility is strict!
// Small model: ONLY 'pingpong' sampler
// 1.0 model: ONLY 'dpmpp-3m-sde' and 'dpmpp-2m-sde' samplers
// Other samplers (k_heun, k_euler, k_euler_a) are not supported by stable-audio-tools
export const SAMPLER_OPTIONS = [
  { value: 'pingpong', label: 'Pingpong (Fast)', models: ['small'] as const },
  { value: 'dpmpp-3m-sde', label: 'DPM++ 3M SDE (Best Quality)', models: ['1.0'] as const },
  { value: 'dpmpp-2m-sde', label: 'DPM++ 2M SDE (Faster)', models: ['1.0'] as const }
] as const

// Get samplers compatible with a model
export const getSamplersForModel = (model: 'small' | '1.0') => {
  return SAMPLER_OPTIONS.filter(s => (s.models as readonly string[]).includes(model))
}
