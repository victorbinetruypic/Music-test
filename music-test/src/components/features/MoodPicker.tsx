'use client'

import { cn } from '@/lib/utils'
import type { Mood } from '@/types'

interface MoodOption {
  value: Mood
  label: string
  description: string
  color: string
  icon: React.ReactNode
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    value: 'energetic',
    label: 'Energetic',
    description: 'High energy, pump you up',
    color: 'bg-orange-500',
    icon: <BoltIcon />,
  },
  {
    value: 'chill',
    label: 'Chill',
    description: 'Relaxed, easy vibes',
    color: 'bg-cyan-500',
    icon: <WaveIcon />,
  },
  {
    value: 'melancholic',
    label: 'Melancholic',
    description: 'Emotional, introspective',
    color: 'bg-indigo-500',
    icon: <MoonIcon />,
  },
  {
    value: 'focused',
    label: 'Focused',
    description: 'Concentration, flow state',
    color: 'bg-emerald-500',
    icon: <TargetIcon />,
  },
  {
    value: 'uplifting',
    label: 'Uplifting',
    description: 'Positive, feel-good',
    color: 'bg-yellow-500',
    icon: <SunIcon />,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Intense, brooding',
    color: 'bg-purple-700',
    icon: <SkullIcon />,
  },
]

interface MoodPickerProps {
  value: Mood | null
  onChange: (mood: Mood) => void
  disabled?: boolean
}

export function MoodPicker({ value, onChange, disabled }: MoodPickerProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Choose your mood</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            disabled={disabled}
            className={cn(
              'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              value === mood.value
                ? 'border-primary bg-accent'
                : 'border-border bg-card'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform',
                mood.color,
                value === mood.value && 'scale-110'
              )}
            >
              {mood.icon}
            </div>
            <div className="text-center">
              <div className="font-medium">{mood.label}</div>
              <div className="text-xs text-muted-foreground">{mood.description}</div>
            </div>
            {value === mood.value && (
              <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Icons
function BoltIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function WaveIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2 0 2.5 2 5 2s3-2 5-2c1.3 0 1.9.5 2.5 1" />
      <path d="M2 7c.6.5 1.2 1 2.5 1C7 8 7 6 9.5 6c2 0 2.5 2 5 2s3-2 5-2c1.3 0 1.9.5 2.5 1" />
      <path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2 0 2.5 2 5 2s3-2 5-2c1.3 0 1.9.5 2.5 1" />
    </svg>
  )
}

function MoonIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function TargetIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function SunIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function SkullIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path d="M8 20v-4a8 8 0 0 1 16 0v4" />
      <path d="M12 4a8 8 0 0 1 8 8v4H4v-4a8 8 0 0 1 8-8z" />
      <path d="M10 20v-1a2 2 0 1 1 4 0v1" />
    </svg>
  )
}

export { MOOD_OPTIONS }
