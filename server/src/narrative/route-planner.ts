import { Spot } from '@prisma/client'
import { prisma } from '../data/prisma'

// ============ 静态距离图（与前端 SPOT_GRAPH 保持一致） ============

interface SpotEdge {
  distance: number
  walkTime: number
}

const SPOT_GRAPH: Record<string, Record<string, SpotEdge>> = {
  'spot-clock': {
    'spot-treasure': { distance: 250, walkTime: 4 },
    'spot-yanxi': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 700, walkTime: 11 },
    'spot-shoukang': { distance: 500, walkTime: 8 },
    'spot-cining': { distance: 550, walkTime: 9 },
  },
  'spot-treasure': {
    'spot-clock': { distance: 250, walkTime: 4 },
    'spot-yanxi': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 650, walkTime: 10 },
    'spot-shoukang': { distance: 450, walkTime: 7 },
    'spot-cining': { distance: 500, walkTime: 8 },
  },
  'spot-ceramic': {
    'spot-clock': { distance: 700, walkTime: 11 },
    'spot-treasure': { distance: 650, walkTime: 10 },
    'spot-yanxi': { distance: 550, walkTime: 9 },
    'spot-shoukang': { distance: 350, walkTime: 6 },
    'spot-cining': { distance: 300, walkTime: 5 },
  },
  'spot-yanxi': {
    'spot-clock': { distance: 200, walkTime: 3 },
    'spot-treasure': { distance: 200, walkTime: 3 },
    'spot-ceramic': { distance: 550, walkTime: 9 },
    'spot-shoukang': { distance: 400, walkTime: 6 },
    'spot-cining': { distance: 450, walkTime: 7 },
  },
  'spot-shoukang': {
    'spot-clock': { distance: 500, walkTime: 8 },
    'spot-treasure': { distance: 450, walkTime: 7 },
    'spot-ceramic': { distance: 350, walkTime: 6 },
    'spot-yanxi': { distance: 400, walkTime: 6 },
    'spot-cining': { distance: 150, walkTime: 2 },
  },
  'spot-cining': {
    'spot-clock': { distance: 550, walkTime: 9 },
    'spot-treasure': { distance: 500, walkTime: 8 },
    'spot-ceramic': { distance: 300, walkTime: 5 },
    'spot-yanxi': { distance: 450, walkTime: 7 },
    'spot-shoukang': { distance: 150, walkTime: 2 },
  },
}

function getEdge(from: string, to: string): SpotEdge | undefined {
  return SPOT_GRAPH[from]?.[to] ?? SPOT_GRAPH[to]?.[from]
}

// ============ 评分模型 ============

const MAX_WALK_TIME = 15

const WEIGHTS = {
  distance: 1.2,
  interest: 1.0,
  connection: 0.8,
}

function distanceScore(walkTime: number): number {
  return Math.max(0, 1 - walkTime / MAX_WALK_TIME)
}

function interestScore(templates: { interestTag: string }[], interestTags: string[]): number {
  return templates.some(t => interestTags.includes(t.interestTag)) ? 1 : 0
}

function connectionScore(connections: { toSpotId: string }[], toSpotId: string): number {
  return connections.some(c => c.toSpotId === toSpotId) ? 1 : 0.3
}

function scoreSpot(
  candidate: Spot,
  currentSpotId: string | null,
  interestTags: string[],
  candidateTemplates: { interestTag: string }[],
  fromConnections: { toSpotId: string }[]
): number {
  const edge = currentSpotId ? getEdge(currentSpotId, candidate.id) : undefined
  const walkTime = edge?.walkTime ?? MAX_WALK_TIME

  const distScore = distanceScore(walkTime)
  const intScore = interestScore(candidateTemplates, interestTags)
  const connScore = connectionScore(fromConnections, candidate.id)

  return WEIGHTS.distance * distScore + WEIGHTS.interest * intScore + WEIGHTS.connection * connScore
}

// ============ 推荐接口 ============

interface RouteContext {
  interestTags: string[]
  completedSpotIds: Set<string>
  allSpots: Spot[]
  currentSpotId?: string | null
}

export async function planRoute(ctx: RouteContext): Promise<Spot> {
  const { completedSpotIds, allSpots, currentSpotId, interestTags } = ctx

  // 硬约束过滤
  const candidates = allSpots.filter(spot => {
    if (spot.type !== 'cold') return false
    if (completedSpotIds.has(spot.id)) return false
    if (spot.status === 'paused') return false
    return true
  })

  if (candidates.length === 0) {
    const coldSpots = allSpots.filter(s => s.type === 'cold')
    return coldSpots[0] || allSpots[0]
  }

  // 获取所有候选点的 templates 和从当前位置出发的 connections
  const [allTemplates, fromConnections] = await Promise.all([
    prisma.narrativeTemplate.findMany({
      where: { spotId: { in: candidates.map(c => c.id) } },
    }),
    currentSpotId
      ? prisma.spotConnection.findMany({ where: { fromSpotId: currentSpotId } })
      : Promise.resolve([]),
  ])

  // 评分排序
  const scored = candidates.map(candidate => {
    const templates = allTemplates.filter(t => t.spotId === candidate.id)
    const score = scoreSpot(candidate, currentSpotId ?? null, interestTags, templates, fromConnections)
    return { candidate, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0].candidate
}

export interface RecommendResult {
  spotId: string
  spotName: string
  reason: string
  distance: number
  walkTime: number
  isNearby: boolean
}

export async function recommendSpot(
  visitorId: string,
  currentSpotId?: string | null
): Promise<RecommendResult | null> {
  const visitor = await prisma.visitorSession.findUnique({
    where: { id: visitorId },
    include: { campaign: { include: { spots: true } } },
  })
  if (!visitor) return null

  const allSpots = visitor.campaign.spots
  const checkIns = await prisma.checkIn.findMany({ where: { visitorId } })
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))

  // 推断当前位置
  let effectiveCurrentSpotId = currentSpotId
  if (!effectiveCurrentSpotId) {
    effectiveCurrentSpotId = visitor.currentSpotId
    if (!effectiveCurrentSpotId && checkIns.length > 0) {
      effectiveCurrentSpotId = checkIns[checkIns.length - 1].spotId
    }
  }

  // 硬约束过滤
  const candidates = allSpots.filter(spot => {
    if (spot.type !== 'cold') return false
    if (completedSpotIds.has(spot.id)) return false
    if (spot.status === 'paused') return false
    return true
  })

  if (candidates.length === 0) return null

  // 获取数据
  const [allTemplates, fromConnections] = await Promise.all([
    prisma.narrativeTemplate.findMany({
      where: { spotId: { in: candidates.map(c => c.id) } },
    }),
    effectiveCurrentSpotId
      ? prisma.spotConnection.findMany({ where: { fromSpotId: effectiveCurrentSpotId } })
      : Promise.resolve([]),
  ])

  // 评分排序
  const scored = candidates.map(candidate => {
    const templates = allTemplates.filter(t => t.spotId === candidate.id)
    const score = scoreSpot(
      candidate,
      effectiveCurrentSpotId ?? null,
      visitor.interestTags,
      templates,
      fromConnections
    )
    return { candidate, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0].candidate

  // 生成文案
  const edge = effectiveCurrentSpotId ? getEdge(effectiveCurrentSpotId, best.id) : undefined
  const connection = fromConnections.find(c => c.toSpotId === best.id)

  let reason: string
  if (connection) {
    const firstSentence = connection.hookFact.split('。')[0] + '。'
    reason = `${firstSentence}此刻${best.name}人少路近，${connection.payoffText}`
  } else {
    reason = `此刻${best.name}人少路近，可优先前往探索。`
  }

  return {
    spotId: best.id,
    spotName: best.name,
    reason,
    distance: edge?.distance ?? 500,
    walkTime: edge?.walkTime ?? 8,
    isNearby: (edge?.distance ?? 500) < 150,
  }
}
