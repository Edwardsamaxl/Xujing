import { buildVoicePrompt } from './prompts/task-generation'
import { getTopFactsBySpot } from '../data'

export interface VoiceChatRequest {
  visitorId: string
  spotId: string
  transcript: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  interestTag?: string
}

export interface VoiceChatResponse {
  replyText: string
  suggestedActions?: Array<'navigate' | 'collect' | 'share'>
  divertHint?: {
    targetSpotId: string
    reason: string
  }
}

export async function handleVoiceChat(req: VoiceChatRequest): Promise<VoiceChatResponse> {
  const { spotId, transcript, conversationHistory, interestTag = '历史' } = req

  // 1. Retrieve relevant facts
  const facts = await getTopFactsBySpot(spotId, 5)

  // 2. Build prompt
  const prompt = buildVoicePrompt({
    spotName: spotId,
    facts: facts.map(f => f.content),
    history: conversationHistory,
    question: transcript,
    interestTag,
  })

  // 3. Call LLM
  try {
    const reply = await callDeepSeek(prompt)

    // 4. Simple diversion intent detection (regex-based for MVP)
    const divertHint = detectDiversionIntent(reply, spotId)

    return {
      replyText: reply,
      divertHint: divertHint || undefined,
    }
  } catch (e) {
    console.error('Voice chat LLM failed:', e)
    return {
      replyText: '叙叙刚才走神了……你能再问一遍吗？',
    }
  }
}

function detectDiversionIntent(reply: string, currentSpotId: string): { targetSpotId: string; reason: string } | null {
  // MVP: simple keyword matching against known spots
  const spotKeywords: Record<string, string> = {
    '钟表馆': 'spot-clock',
    '珍宝馆': 'spot-treasure',
    '陶瓷馆': 'spot-ceramic',
    '武英殿': 'spot-ceramic',
    '延禧宫': 'spot-yanxi',
    '寿康宫': 'spot-shoukang',
    '慈宁宫': 'spot-cining',
  }

  for (const [name, id] of Object.entries(spotKeywords)) {
    if (id !== currentSpotId && reply.includes(name)) {
      return { targetSpotId: id, reason: `AI在回答中提及了${name}` }
    }
  }

  return null
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
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
      temperature: 0.7,
      max_tokens: 256,
    }),
  })

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content?.trim() || '请继续探索。'
}
