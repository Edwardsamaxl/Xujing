import { SPOT_IDS, SPOT_GRAPH, type SpotEdge } from '../data/spots'
import { getCompletedSpots } from './storage'

export interface RouteInfo {
  targetSpotId: string
  distance: number
  walkTime: number
  isNearby: boolean
}

const ENTRY_EDGES: Record<string, SpotEdge> = {
  'spot-clock': { distance: 400, walkTime: 6 },
  'spot-treasure': { distance: 500, walkTime: 8 },
  'spot-ceramic': { distance: 300, walkTime: 5 },
  'spot-yanxi': { distance: 450, walkTime: 7 },
  'spot-shoukang': { distance: 350, walkTime: 6 },
  'spot-cining': { distance: 300, walkTime: 5 },
}

export function getRouteTo(targetSpotId: string): RouteInfo {
  const completed = getCompletedSpots()
  const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null

  const edge = lastCompleted
    ? SPOT_GRAPH[lastCompleted]?.[targetSpotId]
    : ENTRY_EDGES[targetSpotId]

  const distance = edge?.distance ?? 500
  const walkTime = edge?.walkTime ?? 8

  return {
    targetSpotId,
    distance,
    walkTime,
    isNearby: distance < 150,
  }
}

export function getRemainingSpots(): string[] {
  const completed = getCompletedSpots()
  const set = new Set(completed)
  return SPOT_IDS.filter((id) => !set.has(id))
}

export function getRandomUnexploredSpot(): string | null {
  const remaining = getRemainingSpots()
  if (remaining.length === 0) return null
  return remaining[Math.floor(Math.random() * remaining.length)]
}

export function getRecommendedSpot(): string | null {
  // 已废弃：Explore 页面现在直接调用后端 /api/narrative/recommend
  const remaining = getRemainingSpots()
  if (remaining.length === 0) return null
  return remaining[0]
}

/**
 * 累计「入口 → spot1 → spot2 → ...」的真实步行距离与时间。
 * 用 ENTRY_EDGES + SPOT_GRAPH 真实邻接数据，替代 Complete 页之前的估算公式。
 */
export function getTotalRouteStats(completedInOrder: string[]): {
  distance: number
  walkTime: number
} {
  if (completedInOrder.length === 0) return { distance: 0, walkTime: 0 }
  let distance = 0
  let walkTime = 0

  const first = completedInOrder[0]
  const entry = ENTRY_EDGES[first]
  if (entry) {
    distance += entry.distance
    walkTime += entry.walkTime
  }

  for (let i = 1; i < completedInOrder.length; i++) {
    const edge = SPOT_GRAPH[completedInOrder[i - 1]]?.[completedInOrder[i]]
    if (edge) {
      distance += edge.distance
      walkTime += edge.walkTime
    }
  }

  return { distance, walkTime }
}

export function getNextRecommendedSpot(afterSpotId: string): string | null {
  // 已废弃：Narrative 页面的下一站推荐由后端 /api/narrative/next-task 统一处理
  const remaining = getRemainingSpots().filter((id) => id !== afterSpotId)
  if (remaining.length === 0) return null

  // 找距离最近的作为兜底
  let nearest = remaining[0]
  let minDist = Infinity
  for (const id of remaining) {
    const edge = SPOT_GRAPH[afterSpotId]?.[id]
    if (edge && edge.distance < minDist) {
      minDist = edge.distance
      nearest = id
    }
  }
  return nearest
}
