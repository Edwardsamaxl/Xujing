import { chatComplete } from '../llm/deepseek'
import { buildAskSystemPrompt } from './prompt'
import {
  getVisitorById,
  getCheckInsByVisitor,
  getTemplate,
} from '../data'

export interface AskInput {
  visitorId: string
  /** 游客当前所在/当前正在阅读的展馆 id（前端从 URL 参数取） */
  currentSpotId?: string
  question: string
}

export interface AskResult {
  answer: string
}

const FALLBACK_ANSWER = '抱歉，我刚才走神了，请您再问一遍。'
const QUESTION_MAX_LEN = 240

export async function answerQuestion(input: AskInput): Promise<AskResult> {
  const question = input.question?.trim()
  if (!question) {
    return { answer: '请直接问我吧。' }
  }
  // 防御：限制问题长度，避免提示词注入
  const safeQuestion =
    question.length > QUESTION_MAX_LEN
      ? question.slice(0, QUESTION_MAX_LEN)
      : question

  const visitor = await getVisitorById(input.visitorId)
  if (!visitor) throw new Error('Visitor not found')

  const allSpots = visitor.campaign.spots
  const currentSpot = input.currentSpotId
    ? allSpots.find((s) => s.id === input.currentSpotId)
    : undefined

  // 取当前馆 + 主要兴趣的 NarrativeTemplate 作事实参考
  let currentSpotContext: string | undefined
  const primaryInterest = visitor.interestTags[0]
  if (currentSpot && primaryInterest) {
    const tpl = await getTemplate(currentSpot.id, primaryInterest)
    if (tpl) {
      const parts = [tpl.baseContent, tpl.flavorText].filter(
        (s): s is string => typeof s === 'string' && s.length > 0,
      )
      currentSpotContext = parts.join('\n').trim() || undefined
    }
  }

  const checkIns = await getCheckInsByVisitor(input.visitorId)
  const visitedNames = allSpots
    .filter((s) => checkIns.some((c) => c.spotId === s.id))
    .map((s) => s.name)

  const systemPrompt = buildAskSystemPrompt({
    interestTags: visitor.interestTags,
    currentSpotName: currentSpot?.name,
    currentSpotContext,
    visitedNames,
  })

  const answer = await chatComplete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: safeQuestion },
    ],
    { temperature: 0.5, maxTokens: 240 },
  )

  return { answer: answer || FALLBACK_ANSWER }
}
