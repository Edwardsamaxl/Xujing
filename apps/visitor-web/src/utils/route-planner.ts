import { SPOT_IDS, SPOT_GRAPH, type SpotEdge } from '../data/spots'
import { getCompletedSpots, getRouteMode, type RouteMode } from './storage'

export interface RoutePlan {
  currentSpotId: string | null
  nextSpotId: string | null
  remainingSpotIds: string[]
  totalRemainingDistance: number
  totalRemainingTime: number
  nextEdge: SpotEdge | null
  completedCount: number
  totalCount: number
  mode: RouteMode
}

const DEFAULT_START = 'spot-clock'
const EXPRESS_SPOTS = ['spot-clock', 'spot-treasure', 'spot-yanxi']

const ENTRY_EDGES: Record<string, SpotEdge> = {
  'spot-clock': { distance: 400, walkTime: 6 },
  'spot-treasure': { distance: 500, walkTime: 8 },
  'spot-ceramic': { distance: 300, walkTime: 5 },
  'spot-yanxi': { distance: 450, walkTime: 7 },
  'spot-shoukang': { distance: 350, walkTime: 6 },
  'spot-cining': { distance: 300, walkTime: 5 },
}

const MODE_LABEL: Record<RouteMode, string> = {
  archaeology: '深度考古线',
  full: '全域打卡线',
  express: '限时速览线',
}

const MODE_DESC: Record<RouteMode, string> = {
  archaeology: '6个点位 · 最完整的宫廷探索',
  full: '6个点位 · 最优路径覆盖全部',
  express: '3个精选 · 快速核心体验',
}

export function getModeLabel(mode: RouteMode): string {
  return MODE_LABEL[mode]
}

export function getModeDesc(mode: RouteMode): string {
  return MODE_DESC[mode]
}

function findNearest(from: string, candidates: string[]): string {
  let nearest = candidates[0]
  let minDist = Infinity
  for (const c of candidates) {
    const d = SPOT_GRAPH[from]?.[c]?.distance ?? Infinity
    if (d < minDist) {
      minDist = d
      nearest = c
    }
  }
  return nearest
}

function buildGreedyPath(start: string | null, spots: string[]): string[] {
  const remaining = [...spots]
  const path: string[] = []
  let current = start

  while (remaining.length > 0) {
    let next: string
    if (current === null) {
      next = remaining[0]
    } else {
      next = findNearest(current, remaining)
    }
    path.push(next)
    remaining.splice(remaining.indexOf(next), 1)
    current = next
  }

  return path
}

export function planRoute(): RoutePlan {
  const mode = getRouteMode()
  const completed = getCompletedSpots()
  const completedSet = new Set(completed)

  let allSpots: string[]
  if (mode === 'express') {
    allSpots = [...EXPRESS_SPOTS]
  } else {
    allSpots = [...SPOT_IDS]
  }

  const remaining = allSpots.filter((id) => !completedSet.has(id))
  const currentSpotId = completed.length > 0 ? completed[completed.length - 1] : null

  let orderedRemaining: string[]
  if (remaining.length === 0) {
    orderedRemaining = []
  } else if (currentSpotId === null) {
    const hasDefaultStart = remaining.includes(DEFAULT_START)
    if (hasDefaultStart) {
      orderedRemaining = [DEFAULT_START, ...buildGreedyPath(DEFAULT_START, remaining.filter((id) => id !== DEFAULT_START))]
    } else {
      orderedRemaining = buildGreedyPath(null, remaining)
    }
  } else {
    orderedRemaining = buildGreedyPath(currentSpotId, remaining)
  }

  const nextSpotId = orderedRemaining[0] ?? null
  const nextEdge =
    currentSpotId && nextSpotId
      ? SPOT_GRAPH[currentSpotId]?.[nextSpotId] ?? null
      : nextSpotId
        ? ENTRY_EDGES[nextSpotId] ?? { distance: 100, walkTime: 2 }
        : null

  let totalRemainingDistance = 0
  let totalRemainingTime = 0
  for (let i = 0; i < orderedRemaining.length; i++) {
    const from = i === 0 ? currentSpotId : orderedRemaining[i - 1]
    const to = orderedRemaining[i]
    let edge: SpotEdge | undefined
    if (from) {
      edge = SPOT_GRAPH[from]?.[to]
    } else if (to) {
      edge = ENTRY_EDGES[to]
    }
    if (edge) {
      totalRemainingDistance += edge.distance
      totalRemainingTime += edge.walkTime
    }
  }

  return {
    currentSpotId,
    nextSpotId,
    remainingSpotIds: orderedRemaining,
    totalRemainingDistance,
    totalRemainingTime,
    nextEdge,
    completedCount: completed.length,
    totalCount: allSpots.length,
    mode,
  }
}

export function getRouteSpots(mode: RouteMode): string[] {
  if (mode === 'express') return [...EXPRESS_SPOTS]
  return [...SPOT_IDS]
}
