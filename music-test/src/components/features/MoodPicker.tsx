'use client'

import { cn } from '@/lib/utils'
import type { Mood } from '@/types'

interface MoodOption {
  value: Mood
  label: string
  description: string
  gradient: string
  icon: React.ReactNode
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    value: 'energetic',
    label: 'Energetic',
    description: 'High energy, pump you up',
    gradient: 'from-orange-500 to-red-600',
    icon: <BoltIcon />,
  },
  {
    value: 'chill',
    label: 'Chill',
    description: 'Relaxed, easy vibes',
    gradient: 'from-cyan-400 to-blue-500',
    icon: <WaveIcon />,
  },
  {
    value: 'melancholic',
    label: 'Melancholic',
    description: 'Emotional, introspective',
    gradient: 'from-indigo-500 to-purple-600',
    icon: <MoonIcon />,
  },
  {
    value: 'focused',
    label: 'Focused',
    description: 'Concentration, flow state',
    gradient: 'from-emerald-400 to-teal-500',
    icon: <TargetIcon />,
  },
  {
    value: 'uplifting',
    label: 'Uplifting',
    description: 'Positive, feel-good',
    gradient: 'from-yellow-400 to-orange-500',
    icon: <SunIcon />,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Intense, brooding',
    gradient: 'from-purple-600 to-slate-800',
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
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#a7a7a7] uppercase tracking-wide">Choose your mood</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.value}
            onClick={() => onChange(mood.value)}
            disabled={disabled}
            className={cn(
              'group relative flex flex-col items-center gap-3 rounded-lg p-4 transition-all duration-200',
              'bg-[#181818] hover:bg-[#282828]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              'disabled:cursor-not-allowed disabled:opacity-50',
              value === mood.value && 'bg-[#282828] ring-2 ring-[#1DB954]'
            )}
          >
            {/* Gradient icon background */}
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform duration-200',
                `bg-gradient-to-br ${mood.gradient}`,
                'group-hover:scale-110',
                value === mood.value && 'scale-110 shadow-lg'
              )}
            >
              {mood.icon}
            </div>

            {/* Text content */}
            <div className="text-center">
              <div className="font-semibold text-white">{mood.label}</div>
              <div className="text-xs text-[#a7a7a7] mt-0.5">{mood.description}</div>
            </div>

            {/* Selected indicator */}
            {value === mood.value && (
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

// Icons
function BoltIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function WaveIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2 0 2.5 2 5 2s3-2 5-2c1.3 0 1.9.5 2.5 1" />
    </svg>
  )
}

function MoonIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function TargetIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function SunIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2.5" />
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2.5" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2.5" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2.5" />
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2.5" />
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.5" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2.5" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  )
}

function SkullIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="9" cy="12" r="1" fill="currentColor" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
      <path d="M12 4a8 8 0 0 1 8 8v4H4v-4a8 8 0 0 1 8-8z" />
      <path d="M10 20v-1a2 2 0 1 1 4 0v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export { MOOD_OPTIONS }
