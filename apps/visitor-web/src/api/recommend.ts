/** 与后端 /api/narrative/recommend 通信的薄封装 */

export interface RecommendParams {
  visitorId: string
  currentSpotId?: string
}

export interface RecommendResult {
  spotId: string
  spotName: string
  reason: string
  distance: number
  walkTime: number
  isNearby: boolean
}

export async function fetchRecommendation(params: RecommendParams): Promise<RecommendResult | null> {
  const res = await fetch('/api/narrative/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`recommend failed: ${res.status}`)
  }
  return (await res.json()) as RecommendResult
}
