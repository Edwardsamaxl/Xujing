import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import * as service from './service'

vi.mock('./service', () => ({
  getReward: vi.fn(),
}))

describe('GET /api/reward', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns reward data on success', async () => {
    const mockReward = {
      name: '紫禁秘境探索者',
      unlockText: '你找到了隐藏线索',
      imageUrl: null,
      taskIndex: 2,
      totalTasks: 3,
    }
    ;(service.getReward as any).mockResolvedValue(mockReward)

    const res = await request(app)
      .get('/api/reward?visitorId=v-1')

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockReward)
    expect(service.getReward).toHaveBeenCalledWith('v-1')
  })

  it('returns 400 when visitorId is missing', async () => {
    const res = await request(app)
      .get('/api/reward')

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('visitorId required')
  })

  it('returns 500 when service throws', async () => {
    ;(service.getReward as any).mockRejectedValue(new Error('DB error'))

    const res = await request(app)
      .get('/api/reward?visitorId=v-1')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Failed to get reward')
  })
})
