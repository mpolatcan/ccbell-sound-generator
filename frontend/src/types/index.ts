// API Response Types

export interface ModelInfo {
  id: string
  name: string
  description: string
  max_duration: number
  default_steps: number
  default_sampler: string
  parameters: string
}

export interface ThemePreset {
  id: string
  name: string
  description: string
  prompt_template: string
  icon: string
}

// Valid Claude Code hook type IDs
export type HookTypeId =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SubagentStop'
  | 'Bash'
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'Task'
  | 'Error'
  | 'Success'
  | 'Warning'
  | 'Progress'

export interface HookType {
  id: HookTypeId
  name: string
  description: string
  sound_character: string
  suggested_duration: number
}

export interface GenerationSettings {
  steps?: number
  cfg_scale?: number
  sampler?: string
  seed?: number
}

export interface GenerateRequest {
  model: 'small' | '1.0'
  prompt: string
  hook_type: HookTypeId
  duration: number
  settings?: GenerationSettings
}

export interface GenerateResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
}

export interface AudioStatusResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  progress: number
  stage?: string
  audio_url?: string
  error?: string
}

export interface ProgressUpdate {
  progress: number
  stage: string
  audio_url?: string
  error?: string
}

export interface PublishRequest {
  github_token: string
  repo_owner: string
  repo_name: string
  release_tag: string
  release_name: string
  sound_files: string[]
  description?: string
}

export interface PublishResponse {
  success: boolean
  release_url?: string
  error?: string
}

export interface HealthResponse {
  status: string
  version: string
  models_loaded: string[]
}

export type ModelLoadingStatusType = 'idle' | 'loading' | 'ready' | 'error'

export interface ModelLoadingStatus {
  model_id: string
  status: ModelLoadingStatusType
  progress: number
  stage: string | null
  error: string | null
}

export interface ModelsStatusResponse {
  models: Record<string, ModelLoadingStatus>
  current_model: string | null
}

// App State Types

export type SoundStatus = 'generating' | 'completed' | 'error'

export interface GeneratedSound {
  id: string
  job_id: string
  pack_id: string
  hook_type: HookTypeId
  prompt: string
  model: 'small' | '1.0'
  duration: number
  audio_url: string
  status: SoundStatus
  progress?: number
  stage?: string
  error?: string
  created_at: Date
}

export interface SoundPack {
  id: string
  name: string
  theme: string
  model: 'small' | '1.0'
  created_at: Date
}

export interface SoundLibraryState {
  packs: SoundPack[]
  sounds: GeneratedSound[]
  // Pack operations
  addPack: (pack: SoundPack) => void
  removePack: (id: string) => void
  renamePack: (id: string, name: string) => void
  // Sound operations
  addSound: (sound: GeneratedSound) => void
  updateSound: (id: string, updates: Partial<GeneratedSound>) => void
  removeSound: (id: string) => void
  // Bulk operations
  clearAll: () => void
  getSoundsByPack: (packId: string) => GeneratedSound[]
}

export type GenerationStage =
  | 'idle'
  | 'loading_model'
  | 'preparing'
  | 'generating'
  | 'processing_audio'
  | 'saving'
  | 'completed'
  | 'error'

export interface GenerationState {
  isGenerating: boolean
  progress: number
  stage: GenerationStage
  currentJobId: string | null
  error: string | null
}
