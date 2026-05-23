import { planRoute } from './route-planner'
import { buildPrompt } from './prompts/task-generation'
import {
  getVisitorById,
  getCheckInsByVisitor,
  getTemplate,
} from '../data'
import { callDeepSeek } from '../llm/deepseek'

export interface NarrativeResponse {
  currentSpotName: string
  narrativeTitle: string
  narrativeText: string
  destinationHint: string
  nextSpotId: string
  nextSpotName: string
  taskType: 'visit' | 'explore' | 'collect'
  taskIndex: number
  totalTasks: number
  rewardHint?: string
  estimatedDuration?: number
}

export async function generateTask(visitorId: string): Promise<NarrativeResponse> {
  const visitor = await getVisitorById(visitorId)
  if (!visitor) throw new Error('Visitor not found')

  const campaign = visitor.campaign
  const allSpots = campaign.spots
  const checkIns = await getCheckInsByVisitor(visitorId)
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))

  // Route Planner: decide next spot
  const nextSpot = await planRoute({
    interestTags: visitor.interestTags,
    completedSpotIds,
    allSpots,
  })

  // Fetch template for this spot + interest
  const primaryInterest = visitor.interestTags[0] || '历史'
  const template = await getTemplate(nextSpot.id, primaryInterest)

  const baseContent = template?.baseContent || `欢迎来到${nextSpot.name}。`
  const title = template?.title || nextSpot.name
  const flavorText = template?.flavorText || ''

  // Call DeepSeek to generate personalized narrative
  const prompt = buildPrompt({
    title,
    baseContent,
    flavorText,
    spotName: nextSpot.name,
    spotStatus: nextSpot.status,
    interestTags: visitor.interestTags,
    completedSpotIds: Array.from(completedSpotIds),
    totalSpots: allSpots.length,
  })

  const narrativeText = (await callDeepSeek(prompt)) || '请继续探索。'

  // 只统计目的地（cold spots）
  const targetSpots = allSpots.filter(s => s.type === 'cold')
  const completedTargets = targetSpots.filter(s => completedSpotIds.has(s.id))

  // Check if this is the last spot
  const isLast = completedTargets.length + 1 >= targetSpots.length
  const reward = campaign.rewards[0]

  // Determine current spot name from visitor's last check-in
  let currentSpotName = '故宫'
  if (visitor.currentSpotId) {
    const currentSpot = allSpots.find(s => s.id === visitor.currentSpotId)
    if (currentSpot) currentSpotName = currentSpot.name
  } else if (checkIns.length > 0) {
    const lastCheckIn = checkIns[checkIns.length - 1]
    const lastSpot = allSpots.find(s => s.id === lastCheckIn.spotId)
    if (lastSpot) currentSpotName = lastSpot.name
  }

  const taskIndex = completedTargets.length
  const totalTasks = targetSpots.length

  return {
    currentSpotName,
    narrativeTitle: title,
    narrativeText,
    destinationHint: `${nextSpot.name}·${nextSpot.description || ''}`.replace(/·$/, ''),
    nextSpotId: nextSpot.id,
    nextSpotName: nextSpot.name,
    taskType: 'visit',
    taskIndex,
    totalTasks,
    rewardHint: isLast && reward ? reward.unlockText : undefined,
    estimatedDuration: 5,
  }
}

