'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { MoodPicker } from '@/components/features/MoodPicker'
import { DurationPicker } from '@/components/features/DurationPicker'
import { ArcPreview } from '@/components/features/ArcVisualization'
import { WaveformIcon } from '@/components/icons'
import { DEMO_JOURNEY } from '@/lib/demo/data'
import type { Mood, Duration } from '@/types'

export function DemoConfigView(): React.ReactElement {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<Mood | null>('chill')
  const [selectedDuration, setSelectedDuration] = useState<Duration | null>(60)
  const [showJourney, setShowJourney] = useState(false)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#282828]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center">
              <WaveformIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold">Music Journey</h1>
              <p className="text-xs text-[#a7a7a7]">Demo User · 1,234 songs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-[#1DB954]/20 text-[#1DB954] rounded-full">Demo Mode</span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full">Exit Demo</Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#181818] rounded-xl p-4">
            <p className="text-sm text-[#a7a7a7] mb-3">Demo Views:</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/" className="px-4 py-2 bg-[#282828] hover:bg-[#3e3e3e] rounded-full text-sm transition-colors">Landing</Link>
              <span className="px-4 py-2 bg-[#1DB954] text-black rounded-full text-sm font-medium">Config</span>
              <Link href="/?demo=playback" className="px-4 py-2 bg-[#282828] hover:bg-[#3e3e3e] rounded-full text-sm transition-colors">Playback</Link>
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-2xl font-bold">Create a new journey</h2>
            <p className="text-[#a7a7a7]">Select your mood and duration</p>
          </div>

          {showJourney ? (
            <div className="space-y-4">
              <ArcPreview journey={DEMO_JOURNEY} />
              <div className="flex gap-3">
                <Button onClick={() => router.push('/?demo=playback')} className="flex-1 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-6">Start Journey</Button>
                <Button variant="outline" className="border-[#727272] text-white hover:bg-[#282828] hover:border-white rounded-full">Save to Spotify</Button>
              </div>
              <Button variant="ghost" className="w-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full" onClick={() => setShowJourney(false)}>Change Settings</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <MoodPicker value={selectedMood} onChange={setSelectedMood} disabled={false} />
              <DurationPicker value={selectedDuration} onChange={setSelectedDuration} disabled={false} />
              <Button
                onClick={() => setShowJourney(true)}
                disabled={!selectedMood || !selectedDuration}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-6 text-lg disabled:bg-[#282828] disabled:text-[#6a6a6a]"
              >
                Create Journey
              </Button>
              {(!selectedMood || !selectedDuration) && (
                <p className="text-sm text-center text-[#6a6a6a]">Select a mood and duration to create your journey</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
