import { Spot } from '@prisma/client'

interface RouteContext {
  interestTags: string[]
  completedSpotIds: Set<string>
  allSpots: Spot[]
}

export async function planRoute(ctx: RouteContext): Promise<Spot> {
  const { completedSpotIds, allSpots } = ctx

  // Hard constraints
  const candidates = allSpots.filter(spot => {
    if (completedSpotIds.has(spot.id)) return false
    if (spot.status === 'paused') return false
    return true
  })

  if (candidates.length === 0) {
    return allSpots[0]
  }

  // Sort by priority: targeted > normal > crowded
  const statusWeight = (status: string) => {
    switch (status) {
      case 'targeted': return 3
      case 'normal': return 2
      case 'crowded': return 1
      default: return 0
    }
  }

  candidates.sort((a, b) => statusWeight(b.status) - statusWeight(a.status))
  return candidates[0]
}
