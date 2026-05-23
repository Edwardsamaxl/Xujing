/** 与后端 /api/qa 通信的薄封装。 */

export interface AskParams {
  visitorId: string
  /** 当前所在馆 id（可选） */
  currentSpotId?: string
  question: string
}

export async function askQuestion(params: AskParams): Promise<string> {
  const res = await fetch('/api/qa/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    throw new Error(`ask failed: ${res.status}`)
  }
  const data = (await res.json()) as { answer?: string; error?: string }
  if (data.error) throw new Error(data.error)
  return data.answer ?? ''
}
