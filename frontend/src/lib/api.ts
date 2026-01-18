import { API_BASE_URL } from './constants'
import type {
  ModelInfo,
  ThemePreset,
  HookType,
  GenerateRequest,
  GenerateResponse,
  AudioStatusResponse,
  PublishRequest,
  PublishResponse,
  HealthResponse
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
      throw new Error(error.detail || `Request failed: ${response.status}`)
    }

    return response.json()
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request('/api/health')
  }

  // Get available models
  async getModels(): Promise<ModelInfo[]> {
    return this.request('/api/models')
  }

  // Get theme presets
  async getThemes(): Promise<ThemePreset[]> {
    return this.request('/api/themes')
  }

  // Get hook types
  async getHooks(): Promise<HookType[]> {
    return this.request('/api/hooks')
  }

  // Start audio generation
  async generateAudio(request: GenerateRequest): Promise<GenerateResponse> {
    return this.request('/api/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Get audio generation status
  async getAudioStatus(jobId: string): Promise<AudioStatusResponse> {
    return this.request(`/api/audio/${jobId}/status`)
  }

  // Get audio file URL
  getAudioUrl(jobId: string): string {
    return `${this.baseUrl}/api/audio/${jobId}`
  }

  // Delete audio job
  async deleteAudio(jobId: string): Promise<void> {
    await this.request(`/api/audio/${jobId}`, {
      method: 'DELETE'
    })
  }

  // Publish to GitHub
  async publishRelease(request: PublishRequest): Promise<PublishResponse> {
    return this.request('/api/publish', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  // Download audio as blob
  async downloadAudio(jobId: string): Promise<Blob> {
    const url = this.getAudioUrl(jobId)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to download audio')
    }
    return response.blob()
  }
}

export const api = new ApiClient()
