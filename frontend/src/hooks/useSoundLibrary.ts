import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SoundLibraryState, GeneratedSound, SoundPack } from '@/types'

export const useSoundLibrary = create<SoundLibraryState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'ccbell-sound-library',
      // Only persist for the session
      storage: {
        getItem: (name) => {
          const value = sessionStorage.getItem(name)
          return value ? JSON.parse(value) : null
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name)
        }
      }
    }
  )
)
