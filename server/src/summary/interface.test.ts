import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { prisma } from '../data/prisma'

vi.mock('../data/prisma', () => ({
  prisma: {
    visitorSession: {
      findUnique: vi.fn(),
    },
    checkIn: {
      findMany: vi.fn(),
    },
  },
}))

describe('GET /api/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns summary for valid visitor', async () => {
    const mockVisitor = {
      id: 'v-1',
      campaign: {
        spots: [
          { id: 's-1', name: '奉先殿' },
          { id: 's-2', name: '宁寿宫' },
        ],
        rewards: [
          { name: '紫禁秘境探索者', imageUrl: null },
        ],
      },
    }
    const mockCheckIns = [
      { spot: { id: 's-1', name: '奉先殿' } },
      { spot: { id: 's-2', name: '宁寿宫' } },
    ]

    ;(prisma.visitorSession.findUnique as any).mockResolvedValue(mockVisitor)
    ;(prisma.checkIn.findMany as any).mockResolvedValue(mockCheckIns)

    const res = await request(app)
      .get('/api/summary?visitorId=v-1')

    expect(res.status).toBe(200)
    expect(res.body.spots).toHaveLength(2)
    expect(res.body.rewards).toHaveLength(1)
  })

  it('returns 400 when visitorId is missing', async () => {
    const res = await request(app)
      .get('/api/summary')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('visitorId required')
  })

  it('returns 404 when visitor not found', async () => {
    ;(prisma.visitorSession.findUnique as any).mockResolvedValue(null)

    const res = await request(app)
      .get('/api/summary?visitorId=v-1')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Visitor not found')
  })
})
