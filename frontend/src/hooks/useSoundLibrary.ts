import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedSound } from '@/types'

interface SoundLibraryState {
  sounds: GeneratedSound[]
  addSound: (sound: GeneratedSound) => void
  removeSound: (id: string) => void
  clearSounds: () => void
}

export const useSoundLibrary = create<SoundLibraryState>()(
  persist(
    (set) => ({
      sounds: [],

      addSound: (sound) =>
        set((state) => ({
          sounds: [sound, ...state.sounds]
        })),

      removeSound: (id) =>
        set((state) => ({
          sounds: state.sounds.filter((s) => s.id !== id)
        })),

      clearSounds: () => set({ sounds: [] })
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
