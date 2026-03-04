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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Trash2,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Check,
  X,
  Music,
  RefreshCw,
  Sparkles,
  MoreHorizontal,
  Upload
} from 'lucide-react'
import { useGenerationQueue } from '@/hooks/useGenerationQueue'
import { formatDuration, cn } from '@/lib/utils'
import { HOOK_TYPE_COLORS } from '@/lib/constants'
import type { SoundPack, GeneratedSound, PublishPackData, DownloadPackData } from '@/types'
import {
  Collapsible,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

export interface SoundLibraryRef {
  clearAll: () => void
}

interface SoundLibraryProps {
  onSelectForPublish?: (data: PublishPackData) => void
  onSelectForDownload?: (data: DownloadPackData) => void
}

/** Animated waveform bars for empty state */
function AnimatedWaveform() {
  const bars = [0.6, 0.9, 0.4, 1.0, 0.5, 0.8, 0.3]
  return (
    <div className="flex items-end gap-1 h-10">
      {bars.map((height, i) => (
        <div
          key={i}
          className="waveform-bar w-1 rounded-full bg-primary/30"
          style={{
            height: `${height * 100}%`,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
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
    const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set())
    const [editingPackId, setEditingPackId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

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
        <Card className="card-elevated">
          <CardContent className="py-16">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 mb-4">
                <AnimatedWaveform />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground/80 mb-1">Sound Library</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your generated sound packs will appear here. Select a theme and hooks above, then hit Generate to create your first pack.
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground/50">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sounds are generated using Stable Audio Open AI</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="card-elevated">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Sound Library
            <Badge variant="secondary" className="ml-1 font-mono text-xs">
              {packs.length}
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Clear all sound packs"
            title="Clear all (Ctrl+Shift+C)"
          >
            Clear All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            <div className="space-y-3">
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
                    <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50">
                      {/* Pack Header */}
                      <div className="bg-muted/20 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0 text-left">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <Package className="h-4 w-4 shrink-0 text-primary" />
                            {editingPackId === pack.id ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
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
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={savePackName} aria-label="Save pack name">
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditingPack} aria-label="Cancel editing">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="font-medium truncate">{pack.name}</span>
                            )}
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasGenerating && (
                              <Badge variant="outline" className="animate-pulse text-xs border-primary/30 text-primary">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Generating
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs font-mono">
                              {completedSounds.length}/{packSounds.length}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-mono">{pack.model}</Badge>

                            {/* Desktop: full action buttons */}
                            <div className="hidden sm:flex items-center gap-1">
                              {!editingPackId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startEditingPack(pack)
                                  }}
                                  aria-label="Rename pack"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                              {onSelectForDownload && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadPackDialog(pack)
                                  }}
                                  disabled={completedSounds.length === 0}
                                  aria-label="Download pack"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              )}
                              {onSelectForPublish && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePublishPack(pack)
                                  }}
                                  disabled={completedSounds.length === 0}
                                  aria-label="Publish pack to GitHub"
                                >
                                  Publish
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeletePack(pack.id)
                                }}
                                aria-label="Delete pack"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Mobile: overflow dropdown */}
                            <div className="sm:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Pack actions"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => startEditingPack(pack)}>
                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  {onSelectForDownload && (
                                    <DropdownMenuItem
                                      onClick={() => handleDownloadPackDialog(pack)}
                                      disabled={completedSounds.length === 0}
                                    >
                                      <Download className="h-3.5 w-3.5 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                  )}
                                  {onSelectForPublish && (
                                    <DropdownMenuItem
                                      onClick={() => handlePublishPack(pack)}
                                      disabled={completedSounds.length === 0}
                                    >
                                      <Upload className="h-3.5 w-3.5 mr-2" />
                                      Publish
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePack(pack.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pack Contents — always mounted to preserve WaveSurfer instances */}
                      <div className={cn(!isExpanded && "hidden")}>
                        <div className="p-3 space-y-2.5">
                          {packSounds.map((sound, index) => {
                            const hookColor = HOOK_TYPE_COLORS[sound.hook_type]
                            const isGenerating = sound.status === 'generating'
                            const isError = sound.status === 'error'
                            const isCompleted = sound.status === 'completed'

                            return (
                              <div
                                key={sound.id}
                                className={cn(
                                  'p-3 rounded-lg border-l-[3px] border transition-colors sound-card-enter',
                                  hookColor?.border || 'border-l-primary',
                                  isGenerating
                                    ? 'bg-primary/3 border-primary/15 generating-card'
                                    : isError
                                      ? 'bg-destructive/3 border-destructive/15'
                                      : 'bg-muted/15 border-border/30'
                                )}
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={cn('h-2 w-2 rounded-full shrink-0', hookColor?.dot || 'bg-primary')} />
                                      <h4 className="font-display font-medium text-sm">{sound.hook_type}</h4>
                                      <Badge
                                        variant={isCompleted ? 'default' : isGenerating ? 'secondary' : 'destructive'}
                                        className={cn(
                                          'text-[10px]',
                                          isCompleted && 'bg-success text-success-foreground hover:bg-success/80'
                                        )}
                                      >
                                        {isGenerating
                                          ? sound.stage || 'Generating'
                                          : isCompleted
                                            ? 'Completed'
                                            : sound.status}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px]">{formatDuration(sound.duration)}</Badge>
                                      {sound.theme_name && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {sound.theme_name}
                                        </Badge>
                                      )}
                                      {sound.style_name && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {sound.style_name}
                                        </Badge>
                                      )}
                                      {sound.prompt_alias && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {sound.prompt_alias}
                                        </Badge>
                                      )}
                                      {sound.steps != null && (
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                          {sound.steps} steps
                                        </Badge>
                                      )}
                                      {sound.cfg_scale != null && (
                                        <Badge variant="outline" className="text-[10px] font-mono">
                                          CFG {sound.cfg_scale}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                                      {sound.prompt}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 ml-2 shrink-0">
                                    <ElapsedTime
                                      startTime={sound.started_at}
                                      endTime={sound.completed_at}
                                      isRunning={isGenerating}
                                    />
                                    {!isGenerating && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleRegenerateSound(sound)}
                                        aria-label={`Regenerate ${sound.hook_type} sound`}
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeleteSound(sound)}
                                      aria-label={`Delete ${sound.hook_type} sound`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Progress for generating sounds */}
                                {isGenerating && (
                                  <div className="mt-2">
                                    <Progress value={(sound.progress || 0) * 100} className="h-1.5" />
                                    <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                                      {sound.stage} ({Math.round((sound.progress || 0) * 100)}%)
                                    </p>
                                  </div>
                                )}

                                {/* Error message */}
                                {isError && sound.error && (
                                  <p className="text-xs text-destructive mt-2">{sound.error}</p>
                                )}

                                {/* Audio player for completed sounds */}
                                {isCompleted && sound.audio_url && (
                                  <AudioPlayer
                                    audioUrl={sound.audio_url}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
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
