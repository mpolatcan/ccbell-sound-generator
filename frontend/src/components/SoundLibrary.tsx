import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { AudioPlayer } from './AudioPlayer'
import { ElapsedTime } from './ElapsedTime'
import {
  Trash2,
  Download,
  Loader2,
  Volume2,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Check,
  X,
  Music,
  RefreshCw
} from 'lucide-react'
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { formatDuration } from '@/lib/utils'
import type { SoundPack, GeneratedSound, PublishPackData, DownloadPackData } from '@/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

export interface SoundLibraryRef {
  clearAll: () => void
}

interface SoundLibraryProps {
  onSelectForPublish?: (data: PublishPackData) => void
  onSelectForDownload?: (data: DownloadPackData) => void
}

export const SoundLibrary = forwardRef<SoundLibraryRef, SoundLibraryProps>(
  function SoundLibrary({ onSelectForPublish, onSelectForDownload }, ref) {
    const { packs, sounds, removePack, renamePack, removeSound, updateSound, clearAll } = useSoundLibrary(
      useShallow((s) => ({
        packs: s.packs,
        sounds: s.sounds,
        removePack: s.removePack,
        renamePack: s.renamePack,
        removeSound: s.removeSound,
        updateSound: s.updateSound,
        clearAll: s.clearAll,
      }))
    )
    const { addToQueue, cancelGeneration, cancelByPackId, cancelAll: cancelAllQueue } = useGenerationQueue()
    const [previewingSoundId, setPreviewingSoundId] = useState<string | null>(null)
    const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set())
    const [editingPackId, setEditingPackId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const previewAudioRef = useRef<HTMLAudioElement | null>(null)

    // Cleanup audio preview on unmount
    useEffect(() => {
      return () => {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause()
          previewAudioRef.current = null
        }
      }
    }, [])

    // Auto-expand new packs
    const expandedPacksRef = useRef<Set<string>>(new Set())
    useEffect(() => {
      if (packs.length > 0) {
        const latestPackId = packs[0].id
        if (!expandedPacksRef.current.has(latestPackId)) {
          expandedPacksRef.current.add(latestPackId)
          setExpandedPacks(new Set([latestPackId]))
        }
      }
    }, [packs])

    const togglePack = (packId: string) => {
      const newExpanded = new Set(expandedPacks)
      if (newExpanded.has(packId)) {
        newExpanded.delete(packId)
      } else {
        newExpanded.add(packId)
      }
      setExpandedPacks(newExpanded)
    }

    const soundsByPack = useMemo(() => {
      const allMap = new Map<string, GeneratedSound[]>()
      const completedMap = new Map<string, GeneratedSound[]>()
      for (const s of sounds) {
        const all = allMap.get(s.pack_id) ?? []
        all.push(s)
        allMap.set(s.pack_id, all)
        if (s.status === 'completed') {
          const completed = completedMap.get(s.pack_id) ?? []
          completed.push(s)
          completedMap.set(s.pack_id, completed)
        }
      }
      return { all: allMap, completed: completedMap }
    }, [sounds])

    const handlePublishPack = (pack: SoundPack) => {
      const packSounds = soundsByPack.completed.get(pack.id) ?? []
      onSelectForPublish?.({
        packName: pack.name,
        theme: pack.theme,
        model: pack.model,
        sounds: packSounds
      })
    }

    const handleDownloadPackDialog = (pack: SoundPack) => {
      const packSounds = soundsByPack.completed.get(pack.id) ?? []
      onSelectForDownload?.({
        packName: pack.name,
        sounds: packSounds
      })
    }

    const handlePreviewStart = (sound: GeneratedSound) => {
      if (sound.status !== 'completed' || !sound.audio_url) return

      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }

      const audio = new Audio(sound.audio_url)
      audio.volume = 0.5
      audio.play().catch(() => {})
      previewAudioRef.current = audio
      setPreviewingSoundId(sound.id)

      audio.onended = () => {
        setPreviewingSoundId(null)
        previewAudioRef.current = null
      }
    }

    const handlePreviewStop = () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
      setPreviewingSoundId(null)
    }

    const startEditingPack = (pack: SoundPack) => {
      setEditingPackId(pack.id)
      setEditingName(pack.name)
    }

    const savePackName = () => {
      if (editingPackId && editingName.trim()) {
        renamePack(editingPackId, editingName.trim())
      }
      setEditingPackId(null)
      setEditingName('')
    }

    const cancelEditingPack = () => {
      setEditingPackId(null)
      setEditingName('')
    }

    // Delete a single sound from both backend (filesystem) and frontend state
    const handleDeleteSound = useCallback(async (sound: GeneratedSound) => {
      // Cancel generation if sound is queued or actively generating
      cancelGeneration(sound.id)
      // Delete from backend if sound has a job_id (completed sounds)
      if (sound.job_id) {
        try {
          await api.deleteAudio(sound.job_id)
        } catch (error) {
          // Log but don't block - file may already be cleaned up
          console.warn(`Failed to delete audio file for job ${sound.job_id}:`, error)
        }
      }
      // Always remove from frontend state
      removeSound(sound.id)
    }, [removeSound, cancelGeneration])

    // Regenerate a single sound: reset state and re-queue
    const handleRegenerateSound = useCallback(async (sound: GeneratedSound) => {
      // Delete old audio from backend (best-effort)
      if (sound.job_id) {
        try {
          await api.deleteAudio(sound.job_id)
        } catch {
          // Ignore - file may already be cleaned up
        }
      }

      // Reset sound state
      updateSound(sound.id, {
        status: 'generating',
        progress: 0,
        stage: 'Queued',
        audio_url: '',
        job_id: '',
        error: undefined,
        started_at: undefined,
        completed_at: undefined
      })

      // Re-queue for generation
      addToQueue(sound.id, sound.pack_id, {
        model: sound.model,
        prompt: sound.prompt,
        hook_type: sound.hook_type,
        duration: sound.duration
      })
    }, [updateSound, addToQueue])

    // Delete all sounds in a pack from backend, then remove pack from state
    const handleDeletePack = useCallback(async (packId: string) => {
      // Cancel any queued or active generations for this pack
      cancelByPackId(packId)

      const packSounds = soundsByPack.all.get(packId) ?? []

      // Delete all sounds from backend in parallel
      await Promise.all(
        packSounds
          .filter((s) => s.job_id) // Only sounds with job_ids
          .map(async (sound) => {
            try {
              await api.deleteAudio(sound.job_id)
            } catch (error) {
              console.warn(`Failed to delete audio file for job ${sound.job_id}:`, error)
            }
          })
      )

      // Remove pack and all its sounds from frontend state
      removePack(packId)
    }, [soundsByPack, removePack, cancelByPackId])

    // Clear all sounds from backend, then clear frontend state
    const handleClearAll = useCallback(async () => {
      // Cancel all queued and active generations
      cancelAllQueue()

      // Delete all sounds from backend in parallel
      await Promise.all(
        sounds
          .filter((s) => s.job_id) // Only sounds with job_ids
          .map(async (sound) => {
            try {
              await api.deleteAudio(sound.job_id)
            } catch (error) {
              console.warn(`Failed to delete audio file for job ${sound.job_id}:`, error)
            }
          })
      )

      // Clear all from frontend state
      clearAll()
    }, [sounds, clearAll, cancelAllQueue])

    useImperativeHandle(ref, () => ({
      clearAll: handleClearAll
    }))

    if (packs.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="h-5 w-5" />
              Sound Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              Generated sounds will appear here. Start by creating your first sound pack!
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5" />
            Sound Library
            <Badge variant="secondary" className="ml-2">
              {packs.length} {packs.length === 1 ? 'pack' : 'packs'}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearAll} title="Ctrl+Shift+C">
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            <div className="space-y-4">
              {packs.map((pack) => {
                const packSounds = soundsByPack.all.get(pack.id) ?? []
                const completedSounds = soundsByPack.completed.get(pack.id) ?? []
                const isExpanded = expandedPacks.has(pack.id)
                const hasGenerating = packSounds.some((s) => s.status === 'generating')

                return (
                  <Collapsible
                    key={pack.id}
                    open={isExpanded}
                    onOpenChange={() => togglePack(pack.id)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      {/* Pack Header */}
                      <div className="bg-muted/30 p-3">
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <Package className="h-4 w-4 text-primary" />
                            {editingPackId === pack.id ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-7 w-48"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') savePackName()
                                    if (e.key === 'Escape') cancelEditingPack()
                                  }}
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={savePackName}>
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditingPack}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="font-medium">{pack.name}</span>
                            )}
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2">
                            {hasGenerating && (
                              <Badge variant="outline" className="animate-pulse">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              {completedSounds.length}/{packSounds.length} sounds
                            </Badge>
                            <Badge variant="outline">{pack.model}</Badge>
                            {!editingPackId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingPack(pack)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            )}
                            {onSelectForDownload && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadPackDialog(pack)
                                }}
                                disabled={completedSounds.length === 0}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            )}
                            {onSelectForPublish && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePublishPack(pack)
                                }}
                                disabled={completedSounds.length === 0}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePack(pack.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Pack Contents */}
                      <CollapsibleContent>
                        <div className="p-3 space-y-3">
                          {packSounds.map((sound) => (
                            <div
                              key={sound.id}
                              className={`p-3 rounded-md border ${
                                sound.status === 'generating'
                                  ? 'bg-primary/5 border-primary/20'
                                  : sound.status === 'error'
                                    ? 'bg-destructive/5 border-destructive/20'
                                    : 'bg-muted/20'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div
                                  className="flex-1 cursor-pointer"
                                  onMouseEnter={() => handlePreviewStart(sound)}
                                  onMouseLeave={handlePreviewStop}
                                >
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{sound.hook_type}</h4>
                                    <Badge
                                      variant={
                                        sound.status === 'completed'
                                          ? 'default'
                                          : sound.status === 'generating'
                                            ? 'secondary'
                                            : 'destructive'
                                      }
                                    >
                                      {sound.status === 'generating'
                                        ? sound.stage || 'Generating'
                                        : sound.status}
                                    </Badge>
                                    <Badge variant="outline">{formatDuration(sound.duration)}</Badge>
                                    <ElapsedTime
                                      startTime={sound.started_at}
                                      endTime={sound.completed_at}
                                      isRunning={sound.status === 'generating'}
                                    />
                                    {previewingSoundId === sound.id && (
                                      <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                    {sound.prompt}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {sound.status !== 'generating' && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRegenerateSound(sound)}
                                      title="Regenerate"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSound(sound)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Progress for generating sounds */}
                              {sound.status === 'generating' && (
                                <div className="mt-2">
                                  <Progress value={(sound.progress || 0) * 100} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {sound.stage} ({Math.round((sound.progress || 0) * 100)}%)
                                  </p>
                                </div>
                              )}

                              {/* Error message */}
                              {sound.status === 'error' && sound.error && (
                                <p className="text-xs text-destructive mt-2">{sound.error}</p>
                              )}

                              {/* Audio player for completed sounds */}
                              {sound.status === 'completed' && sound.audio_url && (
                                <AudioPlayer
                                  audioUrl={sound.audio_url}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
