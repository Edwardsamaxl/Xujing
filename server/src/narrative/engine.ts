import { PrismaClient } from '@prisma/client'
import { planRoute } from './route-planner'
import { buildPrompt } from './prompts/task-generation'

const prisma = new PrismaClient()

export interface NarrativeResponse {
  narrativeText: string
  nextSpotId: string
  nextSpotName: string
  taskType: 'visit' | 'explore' | 'collect'
  rewardHint?: string
  estimatedDuration?: number
}

export async function generateTask(visitorId: string): Promise<NarrativeResponse> {
  const visitor = await prisma.visitorSession.findUnique({
    where: { id: visitorId },
    include: { campaign: { include: { spots: true, rewards: true } } },
  })
  if (!visitor) throw new Error('Visitor not found')

  const campaign = visitor.campaign
  const allSpots = campaign.spots
  const checkIns = await prisma.checkIn.findMany({ where: { visitorId } })
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))

  // Route Planner: decide next spot
  const nextSpot = await planRoute({
    interestTags: visitor.interestTags,
    completedSpotIds,
    allSpots,
  })

  // Fetch template for this spot + interest
  const primaryInterest = visitor.interestTags[0] || '历史'
  const template = await prisma.narrativeTemplate.findUnique({
    where: { spotId_interestTag: { spotId: nextSpot.id, interestTag: primaryInterest } },
  })

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

  const narrativeText = await callDeepSeek(prompt)

  // Check if this is the last spot
  const isLast = completedSpotIds.size + 1 >= allSpots.length
  const reward = campaign.rewards[0]

  return {
    narrativeText,
    nextSpotId: nextSpot.id,
    nextSpotName: nextSpot.name,
    taskType: 'visit',
    rewardHint: isLast && reward ? reward.unlockText : undefined,
    estimatedDuration: 5,
  }
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  if (!apiKey) {
    // Fallback: return a readable placeholder when API key is not configured
    return `${prompt.slice(0, 80)}...（请在 .env 中配置 DEEPSEEK_API_KEY 以启用 AI 生成）`
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 512,
    }),
  })

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content?.trim() || '请继续探索。'
}
