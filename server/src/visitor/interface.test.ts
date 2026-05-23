import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import { prisma } from '../data/prisma'

vi.mock('../data/prisma', () => ({
  prisma: {
    visitorSession: {
      create: vi.fn(),
    },
  },
}))

describe('POST /api/visitor/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a session with valid input', async () => {
    const mockSession = { id: 'sess-1', campaignId: 'demo', interestTags: ['历史'] }
    ;(prisma.visitorSession.create as any).mockResolvedValue(mockSession)

    const res = await request(app)
      .post('/api/visitor/session')
      .send({ campaignId: 'demo', interestTags: ['历史'] })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockSession)
    expect(prisma.visitorSession.create).toHaveBeenCalledWith({
      data: { campaignId: 'demo', interestTags: ['历史'] },
    })
  })

  it('returns 400 when campaignId is missing', async () => {
    const res = await request(app)
      .post('/api/visitor/session')
      .send({ interestTags: ['历史'] })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('campaignId and interestTags required')
  })

  it('returns 400 when interestTags is not an array', async () => {
    const res = await request(app)
      .post('/api/visitor/session')
      .send({ campaignId: 'demo', interestTags: '历史' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('campaignId and interestTags required')
  })
})
