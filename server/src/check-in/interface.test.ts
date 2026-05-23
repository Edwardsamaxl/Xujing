import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import * as service from './service'

vi.mock('./service', () => ({
  checkIn: vi.fn(),
}))

describe('POST /api/check-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns check-in result on success', async () => {
    const mockResult = { success: true, checkInId: 'ci-1', rewardUnlocked: false, completed: false }
    ;(service.checkIn as any).mockResolvedValue(mockResult)

    const res = await request(app)
      .post('/api/check-in')
      .send({ visitorId: 'v-1', spotId: 's-1' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockResult)
    expect(service.checkIn).toHaveBeenCalledWith('v-1', 's-1')
  })

  it('returns 400 when visitorId is missing', async () => {
    const res = await request(app)
      .post('/api/check-in')
      .send({ spotId: 's-1' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('visitorId and spotId required')
  })

  it('returns 400 when spotId is missing', async () => {
    const res = await request(app)
      .post('/api/check-in')
      .send({ visitorId: 'v-1' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('visitorId and spotId required')
  })

  it('returns 500 when service throws', async () => {
    ;(service.checkIn as any).mockRejectedValue(new Error('DB error'))

    const res = await request(app)
      .post('/api/check-in')
      .send({ visitorId: 'v-1', spotId: 's-1' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Check-in failed')
  })
})
