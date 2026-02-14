'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { Journey, Phase } from '@/types'

interface ArcVisualizationProps {
  journey: Journey
  currentTrackIndex?: number
  showLabels?: boolean
  className?: string
}

const PHASE_COLORS: Record<Phase, string> = {
  opening: 'bg-blue-400',
  build: 'bg-amber-400',
  peak: 'bg-red-500',
  resolve: 'bg-purple-400',
}

const PHASE_LABELS: Record<Phase, string> = {
  opening: 'Opening',
  build: 'Build',
  peak: 'Peak',
  resolve: 'Resolve',
}

export function ArcVisualization({
  journey,
  currentTrackIndex = -1,
  showLabels = true,
  className,
}: ArcVisualizationProps): React.ReactElement {
  const totalTracks = journey.tracks.length

  // Calculate visualization data
  const arcData = useMemo(() => {
    return journey.phases.map((phase) => {
      const trackCount = phase.endIndex - phase.startIndex + 1
      const percentage = (trackCount / totalTracks) * 100

      return {
        phase: phase.phase,
        startIndex: phase.startIndex,
        endIndex: phase.endIndex,
        trackCount,
        percentage,
        color: PHASE_COLORS[phase.phase],
        label: PHASE_LABELS[phase.phase],
      }
    })
  }, [journey.phases, totalTracks])

  // Find current phase
  const currentPhase = useMemo(() => {
    if (currentTrackIndex < 0) return null
    for (const phase of journey.phases) {
      if (currentTrackIndex >= phase.startIndex && currentTrackIndex <= phase.endIndex) {
        return phase.phase
      }
    }
    return null
  }, [journey.phases, currentTrackIndex])

  return (
    <div className={cn('space-y-2', className)}>
      {/* Arc visualization bar */}
      <div className="relative h-12 rounded-lg overflow-hidden bg-muted/30">
        <div className="absolute inset-0 flex">
          {arcData.map((phase, index) => (
            <div
              key={`${phase.phase}-${index}`}
              className={cn(
                'relative flex items-center justify-center transition-all',
                phase.color,
                currentPhase === phase.phase && 'ring-2 ring-white ring-inset'
              )}
              style={{ width: `${phase.percentage}%` }}
            >
              {/* Phase label */}
              {showLabels && phase.percentage > 15 && (
                <span className="text-xs font-medium text-white/90 truncate px-1">
                  {phase.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Current position indicator */}
        {currentTrackIndex >= 0 && totalTracks > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg transition-all duration-300"
            style={{
              left: `${((currentTrackIndex + 0.5) / totalTracks) * 100}%`,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
          </div>
        )}
      </div>

      {/* Phase details */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {arcData.map((phase, index) => (
            <div
              key={`label-${phase.phase}-${index}`}
              className={cn(
                'flex items-center gap-1',
                currentPhase === phase.phase && 'text-foreground font-medium'
              )}
            >
              <div className={cn('w-2 h-2 rounded-full', phase.color)} />
              <span>{phase.trackCount} songs</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact version for playback view
export function ArcVisualizationCompact({
  journey,
  currentTrackIndex = -1,
  className,
}: Omit<ArcVisualizationProps, 'showLabels'>): React.ReactElement {
  const totalTracks = journey.tracks.length
  const progress = totalTracks > 0 ? ((currentTrackIndex + 1) / totalTracks) * 100 : 0

  return (
    <div className={cn('space-y-1', className)}>
      <div className="relative h-2.5 rounded-full overflow-hidden bg-white/10">
        <div className="absolute inset-0 flex">
          {journey.phases.map((phase, index) => {
            const trackCount = phase.endIndex - phase.startIndex + 1
            const percentage = (trackCount / totalTracks) * 100
            return (
              <div
                key={`${phase.phase}-${index}`}
                className={cn(PHASE_COLORS[phase.phase], 'opacity-50')}
                style={{ width: `${percentage}%` }}
              />
            )
          })}
        </div>
        {/* Progress overlay */}
        <div
          className="absolute inset-y-0 left-0 bg-[#1DB954] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#9a9a9a]">
        {journey.phases.map((phase, index) => (
          <div key={`legend-${phase.phase}-${index}`} className="flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', PHASE_COLORS[phase.phase])} />
            <span>{PHASE_LABELS[phase.phase]}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#8a8a8a]">
        <span>Track {currentTrackIndex + 1} of {totalTracks}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}

// Preview version for before playback
export function ArcPreview({
  journey,
  className,
}: {
  journey: Journey
  className?: string
}): React.ReactElement {
  const totalDuration = journey.tracks.reduce((sum, t) => sum + t.durationMs, 0)
  const durationMinutes = Math.round(totalDuration / 60000)

  return (
    <div className={cn('rounded-lg border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Journey Preview</h3>
        <span className="text-sm text-muted-foreground">
          {journey.tracks.length} songs · {durationMinutes} min
        </span>
      </div>

      <ArcVisualization journey={journey} showLabels />

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {journey.phases.map((phase, index) => (
          <div
            key={`preview-${phase.phase}-${index}`}
            className="rounded-md bg-muted/50 p-2"
          >
            <div className={cn('w-3 h-3 rounded-full mx-auto mb-1', PHASE_COLORS[phase.phase])} />
            <div className="font-medium">{PHASE_LABELS[phase.phase]}</div>
            <div className="text-muted-foreground">
              {phase.endIndex - phase.startIndex + 1} songs
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
