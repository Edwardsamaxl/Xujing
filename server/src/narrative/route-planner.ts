import { Spot } from '@prisma/client'

interface RouteContext {
  interestTags: string[]
  completedSpotIds: Set<string>
  allSpots: Spot[]
}

export async function planRoute(ctx: RouteContext): Promise<Spot> {
  const { completedSpotIds, allSpots } = ctx

  // 只选择目的地（cold spots）作为任务目标
  const candidates = allSpots.filter(spot => {
    if (spot.type !== 'cold') return false
    if (completedSpotIds.has(spot.id)) return false
    if (spot.status === 'paused') return false
    return true
  })

  if (candidates.length === 0) {
    // 所有目的地已打卡，返回第一个 cold spot（用于兜底）
    const coldSpots = allSpots.filter(s => s.type === 'cold')
    return coldSpots[0] || allSpots[0]
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
