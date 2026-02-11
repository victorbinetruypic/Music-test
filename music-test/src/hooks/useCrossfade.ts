'use client'

import { useCallback, useEffect } from 'react'

import { usePlayerStore } from '@/stores/playerStore'
import { usePrefsStore } from '@/stores/prefsStore'
import { CrossfadeEngine } from '@/lib/player/crossfade'
import type { PlayerService } from '@/lib/player'

// Singleton crossfade engine
let crossfadeEngine: CrossfadeEngine | null = null

export function getCrossfadeEngine(): CrossfadeEngine | null {
  return crossfadeEngine
}

export function destroyCrossfadeEngine(): void {
  if (crossfadeEngine) {
    crossfadeEngine.destroy()
    crossfadeEngine = null
  }
}

export function useCrossfade(playerService: PlayerService | null) {
  const isSDKReady = usePlayerStore((s) => s.isSDKReady)
  const playbackState = usePlayerStore((s) => s.playbackState)
  const isCrossfadeEnabled = usePlayerStore((s) => s.isCrossfadeEnabled)
  const crossfadeStatus = usePlayerStore((s) => s.crossfadeStatus)
  const setCrossfadeEnabled = usePlayerStore((s) => s.setCrossfadeEnabled)
  const setCrossfadeStatus = usePlayerStore((s) => s.setCrossfadeStatus)

  const savedVolume = usePrefsStore((s) => s.volume)

  // Initialize crossfade engine when SDK is ready
  useEffect(() => {
    if (!isSDKReady || !playerService) return

    if (!crossfadeEngine) {
      crossfadeEngine = new CrossfadeEngine({
        getState: () => playerService.getState(),
        setVolume: (vol) => playerService.setVolume(vol),
        onStatusChange: (status) => setCrossfadeStatus(status),
        onTrackChange: () => {
          // Track change detected by crossfade polling
          // (SDK events handle this primarily, this is a backup)
        },
      })
    }

    crossfadeEngine.setEnabled(isCrossfadeEnabled)
    crossfadeEngine.setUserVolume(savedVolume)
  }, [isSDKReady, playerService, isCrossfadeEnabled, savedVolume, setCrossfadeStatus])

  // Start/stop crossfade polling based on playback state
  useEffect(() => {
    if (!crossfadeEngine) return

    if (playbackState === 'playing') {
      crossfadeEngine.startPolling()
    } else {
      crossfadeEngine.stopPolling()
    }

    return () => {
      crossfadeEngine?.stopPolling()
    }
  }, [playbackState])

  const toggleCrossfade = useCallback(() => {
    const newValue = !isCrossfadeEnabled
    setCrossfadeEnabled(newValue)
    crossfadeEngine?.setEnabled(newValue)
  }, [isCrossfadeEnabled, setCrossfadeEnabled])

  return {
    isCrossfadeEnabled,
    crossfadeStatus,
    toggleCrossfade,
  }
}
