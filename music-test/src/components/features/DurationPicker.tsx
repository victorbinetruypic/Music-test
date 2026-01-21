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
    label: 'Endless',
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
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#a7a7a7] uppercase tracking-wide">How long?</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-lg p-4 transition-all duration-200',
              'bg-[#181818] hover:bg-[#282828]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              'disabled:cursor-not-allowed disabled:opacity-50',
              value === option.value && 'bg-[#282828] ring-2 ring-[#1DB954]'
            )}
          >
            <div className="text-xl font-bold text-white">{option.label}</div>
            <div className="text-xs text-[#a7a7a7]">{option.description}</div>
            <div className="mt-1 text-xs text-[#6a6a6a]">{option.approxSongs}</div>

            {/* Selected indicator */}
            {value === option.value && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-black" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function CheckIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
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
