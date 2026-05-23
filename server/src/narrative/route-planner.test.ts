import { describe, it, expect } from 'vitest'
import { planRoute } from './route-planner'

function makeSpot(overrides: Partial<any> = {}) {
  return {
    id: `spot-${overrides.id ?? Math.random().toString(36).slice(2)}`,
    name: 'Spot',
    campaignId: 'camp-1',
    description: null,
    type: 'cold',
    status: 'normal',
    sortOrder: 0,
    qrPayload: null,
    ...overrides,
  }
}

describe('planRoute', () => {
  it('returns uncompleted cold spot', async () => {
    const spots = [
      makeSpot({ id: 'a', name: 'A' }),
      makeSpot({ id: 'b', name: 'B' }),
      makeSpot({ id: 'c', name: 'C', type: 'hot' }),
    ]
    const result = await planRoute({
      interestTags: ['历史'],
      completedSpotIds: new Set(['a']),
      allSpots: spots,
    })
    expect(result.id).toBe('b')
  })

  it('skips paused spots', async () => {
    const spots = [
      makeSpot({ id: 'a', name: 'A', status: 'paused' }),
      makeSpot({ id: 'b', name: 'B' }),
    ]
    const result = await planRoute({
      interestTags: ['历史'],
      completedSpotIds: new Set(),
      allSpots: spots,
    })
    expect(result.id).toBe('b')
  })

  it('prefers targeted over normal over crowded', async () => {
    const spots = [
      makeSpot({ id: 'a', name: 'A', status: 'crowded' }),
      makeSpot({ id: 'b', name: 'B', status: 'targeted' }),
      makeSpot({ id: 'c', name: 'C', status: 'normal' }),
    ]
    const result = await planRoute({
      interestTags: ['历史'],
      completedSpotIds: new Set(),
      allSpots: spots,
    })
    expect(result.id).toBe('b')
  })

  it('falls back to first cold spot when all completed', async () => {
    const spots = [
      makeSpot({ id: 'a', name: 'A' }),
      makeSpot({ id: 'b', name: 'B' }),
    ]
    const result = await planRoute({
      interestTags: ['历史'],
      completedSpotIds: new Set(['a', 'b']),
      allSpots: spots,
    })
    expect(result.id).toBe('a')
  })
})
