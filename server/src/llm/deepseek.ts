/**
 * DeepSeek 对话补全的薄封装。
 *
 * 抽出来是为了让 narrative（剧情生成）和 qa（问答）共用同一份 fetch 逻辑、
 * 同一份 .env 配置，并且在缺 API key 时给出可读的占位回复，便于本地 demo。
 */

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekOptions {
  temperature?: number
  maxTokens?: number
  model?: string
}

const DEFAULT_MODEL = 'deepseek-chat'

/** 对话式补全：传入消息数组，返回 assistant 文本。 */
export async function chatComplete(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {},
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const { temperature = 0.7, maxTokens = 512, model = DEFAULT_MODEL } = options

  if (!apiKey) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    return `[未配置 DEEPSEEK_API_KEY，模拟回复] ${lastUser?.content?.slice(0, 60) ?? ''}`
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  const data = (await res.json()) as {
    error?: { message?: string; type?: string; code?: string }
    choices?: Array<{ message?: { content?: string } }>
  }

  // DeepSeek 有时在 200 响应体里返回错误对象
  if (data.error) {
    const errMsg = `DeepSeek API error: ${data.error.code ?? 'unknown'} - ${data.error.message ?? JSON.stringify(data.error)}`
    console.error('[deepseek]', errMsg, 'Status:', res.status)
    throw new Error(errMsg)
  }

  if (!res.ok) {
    const errMsg = `DeepSeek API error: ${res.status}`
    console.error('[deepseek]', errMsg, 'Body:', JSON.stringify(data).slice(0, 500))
    throw new Error(errMsg)
  }

  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  if (!content) {
    console.error('[deepseek] Empty content. Response:', JSON.stringify(data).slice(0, 500))
    throw new Error('DeepSeek API returned empty content')
  }

  return content
}

/** 兼容旧调用：单 prompt → 当作 user message 处理。 */
export async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return `${prompt.slice(0, 80)}...（请在 .env 中配置 DEEPSEEK_API_KEY 以启用 AI 生成）`
  }
  return chatComplete([{ role: 'user', content: prompt }], {
    temperature: 0.8,
    maxTokens: 512,
  })
}
