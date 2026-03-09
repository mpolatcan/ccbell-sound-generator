import { create } from 'zustand'
import { audioBlobCache } from '@/lib/audioBlobCache'
import type { SoundLibraryState, GeneratedSound, SoundPack } from '@/types'

/** Revoke a blob URL and remove its cached Blob to free memory. No-op for server URLs. */
function revokeBlobUrl(url: string | undefined) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url)
    audioBlobCache.delete(url)
  }
}

export const useSoundLibrary = create<SoundLibraryState>()((set, get) => ({
  packs: [],
  sounds: [],

  // Pack operations
  addPack: (pack: SoundPack) =>
    set((state) => ({
      packs: [pack, ...state.packs]
    })),

  removePack: (id: string) =>
    set((state) => {
      // Revoke blob URLs for all sounds in this pack
      for (const s of state.sounds) {
        if (s.pack_id === id) revokeBlobUrl(s.audio_url)
      }
      return {
        packs: state.packs.filter((p) => p.id !== id),
        sounds: state.sounds.filter((s) => s.pack_id !== id)
      }
    }),

  renamePack: (id: string, name: string) =>
    set((state) => ({
      packs: state.packs.map((p) =>
        p.id === id ? { ...p, name } : p
      )
    })),

  // Sound operations
  addSound: (sound: GeneratedSound) =>
    set((state) => ({
      sounds: [...state.sounds, sound]
    })),

  updateSound: (id: string, updates: Partial<GeneratedSound>) =>
    set((state) => ({
      sounds: state.sounds.map((s) => {
        if (s.id !== id) return s
        // Guard: don't allow progress-only updates to overwrite a completed sound's audio_url
        if (s.status === 'completed' && s.audio_url && !('audio_url' in updates)) {
          return s
        }
        // Revoke old blob URL if audio_url is being replaced
        if ('audio_url' in updates && updates.audio_url !== s.audio_url) {
          revokeBlobUrl(s.audio_url)
        }
        return { ...s, ...updates }
      })
    })),

  removeSound: (id: string) =>
    set((state) => {
      const sound = state.sounds.find((s) => s.id === id)
      revokeBlobUrl(sound?.audio_url)
      return { sounds: state.sounds.filter((s) => s.id !== id) }
    }),

  // Bulk operations
  clearAll: () => {
    // Revoke all blob URLs before clearing
    for (const s of get().sounds) {
      revokeBlobUrl(s.audio_url)
    }
    set({ packs: [], sounds: [] })
  },

  getSoundsByPack: (packId: string) => {
    return get().sounds.filter((s) => s.pack_id === packId)
  }
}))
