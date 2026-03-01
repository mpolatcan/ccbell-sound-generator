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
      sounds: state.sounds.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      )
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
