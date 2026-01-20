'use client'

import { cn } from '@/lib/utils'
import type { Duration } from '@/types'

interface DurationOption {
  value: Duration
  label: string
  description: string
  approxSongs: string
}

const DURATION_OPTIONS: DurationOption[] = [
  {
    value: 30,
    label: '30 min',
    description: 'Quick session',
    approxSongs: '~8-10 songs',
  },
  {
    value: 60,
    label: '1 hour',
    description: 'Standard journey',
    approxSongs: '~15-20 songs',
  },
  {
    value: 120,
    label: '2 hours',
    description: 'Deep dive',
    approxSongs: '~30-40 songs',
  },
  {
    value: 'open-ended',
    label: 'Open-ended',
    description: 'Keep going',
    approxSongs: 'Until you stop',
  },
]

interface DurationPickerProps {
  value: Duration | null
  onChange: (duration: Duration) => void
  disabled?: boolean
}

export function DurationPicker({ value, onChange, disabled }: DurationPickerProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">How long?</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-lg border-2 p-4 transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              value === option.value
                ? 'border-primary bg-accent'
                : 'border-border bg-card'
            )}
          >
            <div className="text-xl font-bold">{option.label}</div>
            <div className="text-xs text-muted-foreground">{option.description}</div>
            <div className="mt-1 text-xs text-muted-foreground/70">{option.approxSongs}</div>
            {value === option.value && (
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Utility: Get duration in minutes (for open-ended, use a default)
export function getDurationMinutes(duration: Duration): number {
  if (duration === 'open-ended') {
    return 180 // 3 hours as default for open-ended
  }
  return duration
}

// Utility: Get approximate song count for a duration
export function getApproxSongCount(duration: Duration): number {
  const minutes = getDurationMinutes(duration)
  // Average song is ~3.5 minutes
  return Math.round(minutes / 3.5)
}

export { DURATION_OPTIONS }
