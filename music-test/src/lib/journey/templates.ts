import type { ArcTemplate, PhaseDefinition } from './types'
import type { Duration } from '@/types'

// Phase allocation: Opening 15%, Build 30%, Peak 35%, Resolve 20%
const STANDARD_PHASES: PhaseDefinition[] = [
  {
    phase: 'opening',
    percentage: 15,
    energyRange: [0.3, 0.5],
    energyProgression: 'ascending',
  },
  {
    phase: 'build',
    percentage: 30,
    energyRange: [0.5, 0.75],
    energyProgression: 'ascending',
  },
  {
    phase: 'peak',
    percentage: 35,
    energyRange: [0.7, 1.0],
    energyProgression: 'peak',
  },
  {
    phase: 'resolve',
    percentage: 20,
    energyRange: [0.3, 0.6],
    energyProgression: 'descending',
  },
]

export const ARC_TEMPLATES: Record<string, ArcTemplate> = {
  'slow-build': {
    name: 'Slow Build',
    description: 'Gradual energy increase to a single peak',
    phases: STANDARD_PHASES,
  },
  waves: {
    name: 'Waves',
    description: 'Multiple peaks and valleys for longer journeys',
    phases: [
      {
        phase: 'opening',
        percentage: 10,
        energyRange: [0.3, 0.5],
        energyProgression: 'ascending',
      },
      {
        phase: 'build',
        percentage: 20,
        energyRange: [0.5, 0.8],
        energyProgression: 'ascending',
      },
      {
        phase: 'peak',
        percentage: 25,
        energyRange: [0.7, 1.0],
        energyProgression: 'peak',
      },
      {
        phase: 'build',
        percentage: 15,
        energyRange: [0.4, 0.7],
        energyProgression: 'stable',
      },
      {
        phase: 'peak',
        percentage: 20,
        energyRange: [0.75, 1.0],
        energyProgression: 'peak',
      },
      {
        phase: 'resolve',
        percentage: 10,
        energyRange: [0.3, 0.5],
        energyProgression: 'descending',
      },
    ],
  },
  intensity: {
    name: 'Intensity',
    description: 'Quick build to sustained high energy',
    phases: [
      {
        phase: 'opening',
        percentage: 10,
        energyRange: [0.5, 0.7],
        energyProgression: 'ascending',
      },
      {
        phase: 'build',
        percentage: 15,
        energyRange: [0.65, 0.85],
        energyProgression: 'ascending',
      },
      {
        phase: 'peak',
        percentage: 55,
        energyRange: [0.8, 1.0],
        energyProgression: 'stable',
      },
      {
        phase: 'resolve',
        percentage: 20,
        energyRange: [0.4, 0.6],
        energyProgression: 'descending',
      },
    ],
  },
}

/**
 * Select the appropriate arc template based on duration
 */
export function selectTemplate(duration: Duration): ArcTemplate {
  if (duration === 'open-ended' || duration >= 120) {
    return ARC_TEMPLATES.waves
  }

  if (duration <= 30) {
    return ARC_TEMPLATES.intensity
  }

  // Default for 60 min journeys
  return ARC_TEMPLATES['slow-build']
}

/**
 * Calculate the number of songs for each phase based on duration
 */
export function calculatePhaseSongCounts(
  template: ArcTemplate,
  totalSongs: number
): Map<number, number> {
  const counts = new Map<number, number>()
  let allocated = 0

  template.phases.forEach((phase, index) => {
    if (index === template.phases.length - 1) {
      // Last phase gets remaining songs to avoid rounding issues
      counts.set(index, totalSongs - allocated)
    } else {
      const count = Math.round((phase.percentage / 100) * totalSongs)
      counts.set(index, Math.max(1, count)) // Minimum 1 song per phase
      allocated += counts.get(index)!
    }
  })

  return counts
}

/**
 * Get the target energy for a position within a phase
 */
export function getTargetEnergy(
  phase: PhaseDefinition,
  positionInPhase: number, // 0 to 1
): number {
  const [minEnergy, maxEnergy] = phase.energyRange

  switch (phase.energyProgression) {
    case 'ascending':
      return minEnergy + (maxEnergy - minEnergy) * positionInPhase
    case 'descending':
      return maxEnergy - (maxEnergy - minEnergy) * positionInPhase
    case 'peak':
      // Bell curve - peak in the middle
      const peakPosition = 0.5
      const distance = Math.abs(positionInPhase - peakPosition)
      return maxEnergy - (maxEnergy - minEnergy) * distance * 2
    case 'stable':
    default:
      return (minEnergy + maxEnergy) / 2
  }
}
