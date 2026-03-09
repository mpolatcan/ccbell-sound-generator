import { API_BASE_URL } from './constants'
import { fetchAudioBlob } from './audioFetch'
import type {
  ModelInfo,
  ThemePreset,
  HookType,
  GenerateRequest,
  GenerateResponse,
  AudioStatusResponse,
  PublishRequest,
  PublishResponse,
  DownloadPackRequest,
  DownloadPackResponse,
  HealthResponse,
  ModelsStatusResponse,
  ModelLoadingStatus,
  AppConfigResponse,
  UpdateConfigRequest
} from '@/types'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      let message: string
      if (Array.isArray(error.detail)) {
        message = error.detail.map((e: { msg?: string }) => e.msg || String(e)).join('; ')
      } else {
        message = error.detail || `Request failed: ${response.status}`
      }
      throw new Error(message)
    }

    return response.json()
  }

  // Health check
  getHealth = async (): Promise<HealthResponse> => {
    return this.request('/api/health')
  }

  // Get runtime config
  getConfig = async (): Promise<AppConfigResponse> => {
    return this.request('/api/config')
  }

  // Update runtime config
  updateConfig = async (request: UpdateConfigRequest): Promise<AppConfigResponse> => {
    return this.request('/api/config', {
      method: 'PUT',
      body: JSON.stringify(request)
    })
  }

  // Get available models
  getModels = async (): Promise<ModelInfo[]> => {
    return this.request('/api/models')
  }

  // Get models loading status
  getModelsStatus = async (): Promise<ModelsStatusResponse> => {
    return this.request('/api/models/status')
  }

  // Get specific model loading status
  getModelStatus = async (modelId: string): Promise<ModelLoadingStatus> => {
    return this.request(`/api/models/${modelId}/status`)
  }

  // Trigger model loading
  loadModel = async (modelId: string): Promise<{ status: string; model_id: string }> => {
    return this.request(`/api/models/${modelId}/load`, {
      method: 'POST'
    })
  }

  // Get theme presets
  getThemes = async (): Promise<ThemePreset[]> => {
    return this.request('/api/themes')
  }

  // Get hook types
  getHooks = async (): Promise<HookType[]> => {
    return this.request('/api/hooks')
  }

  // Start audio generation
  generateAudio = async (request: GenerateRequest): Promise<GenerateResponse> => {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Get audio generation status
  getAudioStatus = async (jobId: string): Promise<AudioStatusResponse> => {
    return this.request(`/api/audio/${jobId}/status`)
  }

  // Get audio file URL
  getAudioUrl = (jobId: string): string => {
    return `${this.baseUrl}/api/audio/${jobId}`
  }

  // Delete audio job
  deleteAudio = async (jobId: string): Promise<void> => {
    await this.request(`/api/audio/${jobId}`, {
      method: 'DELETE'
    })
  }

  // Publish to GitHub
  publishRelease = async (request: PublishRequest): Promise<PublishResponse> => {
    return this.request('/api/publish', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Download audio as blob
  downloadAudio = async (jobId: string): Promise<Blob> => {
    return fetchAudioBlob(this.getAudioUrl(jobId))
  }

  // Create a downloadable pack ZIP
  createPack = async (request: DownloadPackRequest): Promise<DownloadPackResponse> => {
    return this.request('/api/packs', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Get pack download URL
  getPackDownloadUrl = (packId: string): string => {
    // In Tauri mode, baseUrl already contains the full origin
    if (this.baseUrl.startsWith('http')) {
      return `${this.baseUrl}/api/packs/${packId}`
    }
    return `${window.location.origin}${this.baseUrl}/api/packs/${packId}`
  }
}

export const api = new ApiClient()
