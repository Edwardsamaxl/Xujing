import { planRoute } from './route-planner'
import { buildThreeStepPrompt } from './prompts/task-generation'
import {
  getVisitorById,
  getCheckInsByVisitor,
  getTemplate,
  getTopFactsBySpot,
  getConnectionsFrom,
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

  // Determine current spot
  let currentSpot = allSpots.find(s => s.id === visitor.currentSpotId)
  if (!currentSpot && checkIns.length > 0) {
    const lastCheckIn = checkIns[checkIns.length - 1]
    currentSpot = allSpots.find(s => s.id === lastCheckIn.spotId)
  }
  if (!currentSpot) {
    currentSpot = allSpots[0]
  }

  // Route Planner: decide next spot
  const nextSpot = await planRoute({
    interestTags: visitor.interestTags,
    completedSpotIds,
    allSpots,
    currentSpotId: currentSpot?.id,
  })

  // Fetch knowledge base
  const primaryInterest = visitor.interestTags[0] || '历史'
  const template = await getTemplate(nextSpot.id, primaryInterest)
  const facts = await getTopFactsBySpot(currentSpot.id, 3)
  const connections = await getConnectionsFrom(currentSpot.id)

  // Find best connection to nextSpot
  const connection = connections.find(c => c.toSpotId === nextSpot.id)

  // Fallback narrative parts for when LLM fails
  const fallbackTitle = template?.title || nextSpot.name
  const fallbackContent = template?.baseContent || `欢迎来到${nextSpot.name}。`

  // Try LLM generation
  let narrativeText: string
  try {
    const prompt = buildThreeStepPrompt({
      currentSpotName: currentSpot.name,
      currentSpotFacts: facts.map(f => f.content),
      targetSpotName: nextSpot.name,
      targetSpotTeaser: nextSpot.description || '',
      connectionHookFact: connection?.hookFact || `${nextSpot.name}与${currentSpot.name}有着深厚的历史渊源。`,
      connectionPayoffText: connection?.payoffText || `去${nextSpot.name}，你会发现更多隐藏的线索。`,
      interestTag: primaryInterest,
      completedCount: completedSpotIds.size,
      totalCount: allSpots.filter(s => s.type === 'cold').length,
      crowdStatus: currentSpot.status === 'crowded' ? 'crowded' : 'smooth',
      targetStatus: nextSpot.status,
      rewardHint: undefined,
    })

    narrativeText = (await callDeepSeek(prompt)) || '请继续探索。'

    // Validate output length
    if (narrativeText.length < 50 || narrativeText.length > 400) {
      throw new Error('LLM output length invalid')
    }
  } catch (e) {
    console.error('LLM generation failed, using fallback:', e)
    // Fallback: use template + simple hook
    narrativeText = generateFallbackNarrative({
      baseContent: fallbackContent,
      nextSpotName: nextSpot.name,
      connectionPayoffText: connection?.payoffText,
      flavorText: template?.flavorText,
    })
  }

  // Stats
  const targetSpots = allSpots.filter(s => s.type === 'cold')
  const completedTargets = targetSpots.filter(s => completedSpotIds.has(s.id))
  const allCompleted = completedTargets.length >= targetSpots.length
  const isLast = completedTargets.length + 1 >= targetSpots.length
  const reward = campaign.rewards[0]

  const taskIndex = completedTargets.length
  const totalTasks = targetSpots.length

  return {
    currentSpotName: currentSpot.name,
    narrativeTitle: fallbackTitle,
    narrativeText,
    destinationHint: allCompleted
      ? ''
      : `${nextSpot.name}·${nextSpot.description || ''}`.replace(/·$/, ''),
    nextSpotId: allCompleted ? '' : nextSpot.id,
    nextSpotName: allCompleted ? '' : nextSpot.name,
    taskType: 'visit',
    taskIndex,
    totalTasks,
    rewardHint: isLast && reward ? reward.unlockText : undefined,
    estimatedDuration: 5,
  }
}

interface FallbackCtx {
  baseContent: string
  nextSpotName: string
  connectionPayoffText?: string
  flavorText?: string | null
}

function generateFallbackNarrative(ctx: FallbackCtx): string {
  const { baseContent, nextSpotName, connectionPayoffText, flavorText } = ctx
  // Take first sentence of baseContent as认知重构
  const firstSentence = baseContent.split('。')[0] + '。'
  const payoff = connectionPayoffText || `此时${nextSpotName}正显得格外静谧，或许那里藏着这段故事的另一半。`

  return `${firstSentence}${flavorText ? `「${flavorText}」` : ''}${payoff}`
}

// 为指定当前点位生成叙事（含软导流钩子）
export async function generateSpotNarrative(
  visitorId: string,
  currentSpotId: string,
  interestTag?: string
): Promise<NarrativeResponse> {
  const visitor = await getVisitorById(visitorId)
  if (!visitor) throw new Error('Visitor not found')

  const campaign = visitor.campaign
  const allSpots = campaign.spots
  const checkIns = await getCheckInsByVisitor(visitorId)
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))

  const currentSpot = allSpots.find(s => s.id === currentSpotId)
  if (!currentSpot) throw new Error('Spot not found')

  // Decide next spot via route planner
  const nextSpot = await planRoute({
    interestTags: visitor.interestTags,
    completedSpotIds,
    allSpots,
    currentSpotId: currentSpot.id,
  })

  const primaryInterest = interestTag || visitor.interestTags[0] || '历史'
  const template = await getTemplate(currentSpotId, primaryInterest)
  const facts = await getTopFactsBySpot(currentSpotId, 3)
  const connections = await getConnectionsFrom(currentSpotId)
  const connection = connections.find(c => c.toSpotId === nextSpot.id)

  const fallbackTitle = template?.title || currentSpot.name
  const fallbackContent = template?.baseContent || `欢迎来到${currentSpot.name}。`

  let narrativeText: string
  try {
    const prompt = buildThreeStepPrompt({
      currentSpotName: currentSpot.name,
      currentSpotFacts: facts.map(f => f.content),
      targetSpotName: nextSpot.name,
      targetSpotTeaser: nextSpot.description || '',
      connectionHookFact: connection?.hookFact || `${nextSpot.name}与${currentSpot.name}有着深厚的历史渊源。`,
      connectionPayoffText: connection?.payoffText || `去${nextSpot.name}，你会发现更多隐藏的线索。`,
      interestTag: primaryInterest,
      completedCount: completedSpotIds.size,
      totalCount: allSpots.filter(s => s.type === 'cold').length,
      crowdStatus: currentSpot.status === 'crowded' ? 'crowded' : 'smooth',
      targetStatus: nextSpot.status,
      rewardHint: undefined,
    })

    narrativeText = (await callDeepSeek(prompt)) || '请继续探索。'

    if (narrativeText.length < 50 || narrativeText.length > 400) {
      throw new Error('LLM output length invalid')
    }
  } catch (e) {
    console.error('LLM generation failed, using fallback:', e)
    narrativeText = generateFallbackNarrative({
      baseContent: fallbackContent,
      nextSpotName: nextSpot.name,
      connectionPayoffText: connection?.payoffText,
      flavorText: template?.flavorText,
    })
  }

  const targetSpots = allSpots.filter(s => s.type === 'cold')
  const completedTargets = targetSpots.filter(s => completedSpotIds.has(s.id))
  const allCompleted = completedTargets.length >= targetSpots.length
  const isLast = completedTargets.length + 1 >= targetSpots.length
  const reward = campaign.rewards[0]

  return {
    currentSpotName: currentSpot.name,
    narrativeTitle: fallbackTitle,
    narrativeText,
    destinationHint: allCompleted
      ? ''
      : `${nextSpot.name}·${nextSpot.description || ''}`.replace(/·$/, ''),
    nextSpotId: allCompleted ? '' : nextSpot.id,
    nextSpotName: allCompleted ? '' : nextSpot.name,
    taskType: 'visit',
    taskIndex: completedTargets.length,
    totalTasks: targetSpots.length,
    rewardHint: isLast && reward ? reward.unlockText : undefined,
    estimatedDuration: 5,
  }
}
