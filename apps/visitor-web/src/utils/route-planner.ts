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
    isNearby: distance < 100,
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
  const remaining = getRemainingSpots()
  if (remaining.length === 0) return null
  // 弱推荐：简单 hash 推荐一个
  const hour = new Date().getHours()
  const idx = (hour + remaining.length) % remaining.length
  return remaining[idx]
}

export function getNextRecommendedSpot(afterSpotId: string): string | null {
  const remaining = getRemainingSpots().filter((id) => id !== afterSpotId)
  if (remaining.length === 0) return null

  // 找距离最近的
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
