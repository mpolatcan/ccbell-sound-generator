/**
 * Hook to manage app settings in Tauri desktop mode.
 * In web mode, settings are managed server-side via environment variables.
 */
import { useState, useEffect, useCallback } from 'react'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export interface AppSettings {
  github_token?: string
  max_concurrent_generations?: number
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isTauri) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const data = await invoke<AppSettings>('get_settings')
        setSettings(data)
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    if (!isTauri) return

    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('save_settings', { settings: newSettings })
      setSettings(newSettings)
    } catch (err) {
      console.error('Failed to save settings:', err)
      throw err
    }
  }, [])

  return {
    settings,
    saveSettings,
    loading,
    isDesktop: isTauri,
  }
}
