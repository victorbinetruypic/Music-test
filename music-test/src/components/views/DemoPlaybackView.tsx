'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { DEMO_TRACKS, DEMO_JOURNEY } from '@/lib/demo/data'
import {
  ChevronLeftIcon, MusicNoteIcon, PlayIcon, PauseIcon,
  SkipBackIcon, SkipForwardIcon, XIcon,
} from '@/components/icons'

export function DemoPlaybackView(): React.ReactElement {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const currentTrack = DEMO_TRACKS[currentTrackIndex]
  const nextTrack = DEMO_TRACKS[currentTrackIndex + 1]

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1)
      setProgress(0)
    }
  }

  const handleNext = () => {
    if (currentTrackIndex < DEMO_TRACKS.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
      setProgress(0)
    }
  }

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (currentTrackIndex < DEMO_TRACKS.length - 1) {
            setCurrentTrackIndex((prev) => prev + 1)
            return 0
          }
          setIsPlaying(false)
          return 100
        }
        return p + 0.5
      })
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, currentTrackIndex])

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor(ms / 60000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-gradient-to-b from-black to-transparent px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/?demo=config" className="flex items-center gap-2 text-[#a7a7a7] hover:text-white transition-colors">
            <ChevronLeftIcon className="w-6 h-6" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-[#1DB954]/20 text-[#1DB954] rounded-full">Demo Mode</span>
            <span className="text-sm text-[#a7a7a7]">Now Playing</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="px-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#181818] rounded-xl p-4">
            <p className="text-sm text-[#a7a7a7] mb-3">Demo Views:</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/" className="px-4 py-2 bg-[#282828] hover:bg-[#3e3e3e] rounded-full text-sm transition-colors">Landing</Link>
              <Link href="/?demo=config" className="px-4 py-2 bg-[#282828] hover:bg-[#3e3e3e] rounded-full text-sm transition-colors">Config</Link>
              <span className="px-4 py-2 bg-[#1DB954] text-black rounded-full text-sm font-medium">Playback</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-[#a7a7a7]">
            <span>Track {currentTrackIndex + 1} of {DEMO_TRACKS.length}</span>
            <span className="capitalize">{DEMO_JOURNEY.mood} Journey</span>
          </div>

          <div className="h-1 bg-[#282828] rounded-full overflow-hidden">
            <div className="h-full bg-[#1DB954] transition-all duration-300" style={{ width: `${((currentTrackIndex + progress / 100) / DEMO_TRACKS.length) * 100}%` }} />
          </div>

          <div className="bg-[#181818] rounded-xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-[#1DB954] to-[#191414] flex items-center justify-center flex-shrink-0">
                <MusicNoteIcon className="w-12 h-12 text-white/50" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">{currentTrack.name}</h2>
                <p className="text-lg text-[#a7a7a7] truncate">{currentTrack.artist}</p>
                <div className="mt-3 flex items-center gap-4 text-sm text-[#6a6a6a]">
                  <span>Energy: {Math.round(currentTrack.energy * 100)}%</span>
                  <span>Mood: {Math.round(currentTrack.valence * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="h-1 bg-[#282828] rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-[#a7a7a7]">
                <span>{formatTime((progress / 100) * currentTrack.durationMs)}</span>
                <span>{formatTime(currentTrack.durationMs)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <Button variant="ghost" onClick={handlePrevious} disabled={currentTrackIndex === 0} className="h-12 w-12 rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] disabled:opacity-30">
                <SkipBackIcon className="h-6 w-6" />
              </Button>
              <Button onClick={() => setIsPlaying(!isPlaying)} className="h-16 w-16 rounded-full bg-white hover:bg-[#f0f0f0] hover:scale-105 transition-transform">
                {isPlaying ? <PauseIcon className="h-8 w-8 text-black" /> : <PlayIcon className="h-8 w-8 text-black ml-1" />}
              </Button>
              <Button variant="ghost" onClick={handleNext} disabled={currentTrackIndex === DEMO_TRACKS.length - 1} className="h-12 w-12 rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] disabled:opacity-30">
                <SkipForwardIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {nextTrack && (
            <div className="bg-[#181818] rounded-xl p-4">
              <p className="text-sm font-medium text-[#a7a7a7] mb-3">Up next</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded bg-gradient-to-br from-[#282828] to-[#181818] flex items-center justify-center flex-shrink-0">
                  <MusicNoteIcon className="w-6 h-6 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{nextTrack.name}</p>
                  <p className="text-sm text-[#a7a7a7] truncate">{nextTrack.artist}</p>
                </div>
              </div>
            </div>
          )}

          <Button variant="ghost" className="w-full text-[#a7a7a7] hover:text-white hover:bg-[#282828] rounded-full flex items-center justify-center gap-2">
            <XIcon className="w-4 h-4" />
            <span>Not this song</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
