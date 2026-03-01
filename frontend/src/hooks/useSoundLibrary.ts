import { create } from 'zustand'
import type { SoundLibraryState, GeneratedSound, SoundPack } from '@/types'

export const useSoundLibrary = create<SoundLibraryState>()((set, get) => ({
  packs: [],
  sounds: [],

  // Pack operations
  addPack: (pack: SoundPack) =>
    set((state) => ({
      packs: [pack, ...state.packs]
    })),

  removePack: (id: string) =>
    set((state) => ({
      packs: state.packs.filter((p) => p.id !== id),
      sounds: state.sounds.filter((s) => s.pack_id !== id)
    })),

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
        return { ...s, ...updates }
      })
    })),

  removeSound: (id: string) =>
    set((state) => ({
      sounds: state.sounds.filter((s) => s.id !== id)
    })),

  // Bulk operations
  clearAll: () => set({ packs: [], sounds: [] }),

  getSoundsByPack: (packId: string) => {
    return get().sounds.filter((s) => s.pack_id === packId)
  }
}))
