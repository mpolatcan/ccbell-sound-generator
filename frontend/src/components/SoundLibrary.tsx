import { useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import JSZip from 'jszip'
import { useSoundLibrary } from '@/hooks/useSoundLibrary'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { AudioPlayer } from './AudioPlayer'
import { ElapsedTime } from './ElapsedTime'
import {
  Trash2,
  Archive,
  Loader2,
  Volume2,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Check,
  X,
  Music
} from 'lucide-react'
import { formatDuration, downloadBlob } from '@/lib/utils'
import type { SoundPack, GeneratedSound } from '@/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

export interface SoundLibraryRef {
  downloadZip: () => void
  clearAll: () => void
}

interface SoundLibraryProps {
  onSelectForPublish?: (soundIds: string[]) => void
}

export const SoundLibrary = forwardRef<SoundLibraryRef, SoundLibraryProps>(
  function SoundLibrary({ onSelectForPublish }, ref) {
    const { packs, sounds, removePack, renamePack, removeSound, clearAll } = useSoundLibrary()
    const [isDownloading, setIsDownloading] = useState(false)
    const [previewingSoundId, setPreviewingSoundId] = useState<string | null>(null)
    const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set())
    const [editingPackId, setEditingPackId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const previewAudioRef = useRef<HTMLAudioElement | null>(null)

    // Auto-expand new packs
    const expandedPacksRef = useRef<Set<string>>(new Set())
    if (packs.length > 0) {
      const latestPackId = packs[0].id
      if (!expandedPacksRef.current.has(latestPackId)) {
        expandedPacksRef.current.add(latestPackId)
        if (!expandedPacks.has(latestPackId)) {
          setExpandedPacks(new Set([...expandedPacks, latestPackId]))
        }
      }
    }

    const togglePack = (packId: string) => {
      const newExpanded = new Set(expandedPacks)
      if (newExpanded.has(packId)) {
        newExpanded.delete(packId)
      } else {
        newExpanded.add(packId)
      }
      setExpandedPacks(newExpanded)
    }

    const getSoundsForPack = (packId: string): GeneratedSound[] => {
      return sounds.filter((s) => s.pack_id === packId)
    }

    const getCompletedSoundsForPack = (packId: string): GeneratedSound[] => {
      return sounds.filter((s) => s.pack_id === packId && s.status === 'completed')
    }

    const handleDownloadPack = async (pack: SoundPack) => {
      const packSounds = getCompletedSoundsForPack(pack.id)
      if (packSounds.length === 0) return

      setIsDownloading(true)
      try {
        const zip = new JSZip()
        const folder = zip.folder(pack.name.replace(/[/\\?%*:|"<>]/g, '-'))

        if (folder) {
          await Promise.all(
            packSounds.map(async (sound, index) => {
              const response = await fetch(sound.audio_url)
              const blob = await response.blob()
              // Add index to avoid overwrites for same hook type
              const filename = packSounds.filter(s => s.hook_type === sound.hook_type).length > 1
                ? `${sound.hook_type.toLowerCase()}_${index + 1}.wav`
                : `${sound.hook_type.toLowerCase()}.wav`
              folder.file(filename, blob)
            })
          )
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(zipBlob, `${pack.name.replace(/[/\\?%*:|"<>]/g, '-')}.zip`)
      } catch (error) {
        console.error('Failed to create ZIP:', error)
      } finally {
        setIsDownloading(false)
      }
    }

    const handleDownloadAll = async () => {
      const completedSounds = sounds.filter((s) => s.status === 'completed')
      if (completedSounds.length === 0) return

      setIsDownloading(true)
      try {
        const zip = new JSZip()

        // Group by pack
        for (const pack of packs) {
          const packSounds = getCompletedSoundsForPack(pack.id)
          if (packSounds.length === 0) continue

          const folder = zip.folder(pack.name.replace(/[/\\?%*:|"<>]/g, '-'))
          if (folder) {
            await Promise.all(
              packSounds.map(async (sound, index) => {
                const response = await fetch(sound.audio_url)
                const blob = await response.blob()
                const filename = packSounds.filter(s => s.hook_type === sound.hook_type).length > 1
                  ? `${sound.hook_type.toLowerCase()}_${index + 1}.wav`
                  : `${sound.hook_type.toLowerCase()}.wav`
                folder.file(filename, blob)
              })
            )
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(zipBlob, 'ccbell-sounds.zip')
      } catch (error) {
        console.error('Failed to create ZIP:', error)
      } finally {
        setIsDownloading(false)
      }
    }

    const handlePublishPack = (packId: string) => {
      const packSounds = getCompletedSoundsForPack(packId)
      onSelectForPublish?.(packSounds.map((s) => s.job_id))
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
    }, [removeSound])

    // Delete all sounds in a pack from backend, then remove pack from state
    const handleDeletePack = useCallback(async (packId: string) => {
      const packSounds = sounds.filter((s) => s.pack_id === packId)

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
    }, [sounds, removePack])

    // Clear all sounds from backend, then clear frontend state
    const handleClearAll = useCallback(async () => {
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
    }, [sounds, clearAll])

    useImperativeHandle(ref, () => ({
      downloadZip: handleDownloadAll,
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloading || sounds.filter((s) => s.status === 'completed').length === 0}
              title="Ctrl+D"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Download All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearAll} title="Ctrl+Shift+C">
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {packs.map((pack) => {
                const packSounds = getSoundsForPack(pack.id)
                const completedSounds = getCompletedSoundsForPack(pack.id)
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadPack(pack)
                              }}
                              disabled={isDownloading || completedSounds.length === 0}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                            {onSelectForPublish && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePublishPack(pack.id)
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
                                    {previewingSoundId === sound.id && (
                                      <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                    {sound.prompt}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSound(sound)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Progress for generating sounds */}
                              {sound.status === 'generating' && (
                                <div className="mt-2">
                                  <Progress value={(sound.progress || 0) * 100} className="h-2" />
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-muted-foreground">
                                      {sound.stage} ({Math.round((sound.progress || 0) * 100)}%)
                                    </p>
                                    <ElapsedTime
                                      startTime={sound.started_at}
                                      isRunning={sound.status === 'generating'}
                                    />
                                  </div>
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
                                  filename={`${sound.hook_type.toLowerCase()}.wav`}
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
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }
)
