import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../index'
import * as engine from './engine'

vi.mock('./engine', () => ({
  generateTask: vi.fn(),
}))

describe('POST /api/narrative/next-task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a task on success', async () => {
    const mockTask = {
      currentSpotName: '故宫',
      narrativeTitle: '测试标题',
      narrativeText: '测试文本',
      destinationHint: '测试目的地',
      nextSpotId: 'spot-1',
      nextSpotName: '奉先殿',
      taskType: 'visit',
      taskIndex: 0,
      totalTasks: 3,
    }
    ;(engine.generateTask as any).mockResolvedValue(mockTask)

    const res = await request(app)
      .post('/api/narrative/next-task')
      .send({ visitorId: 'v-1' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(mockTask)
    expect(engine.generateTask).toHaveBeenCalledWith('v-1')
  })

  it('returns 400 when visitorId is missing', async () => {
    const res = await request(app)
      .post('/api/narrative/next-task')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('visitorId required')
  })

  it('returns 500 when engine throws', async () => {
    ;(engine.generateTask as any).mockRejectedValue(new Error('Engine error'))

    const res = await request(app)
      .post('/api/narrative/next-task')
      .send({ visitorId: 'v-1' })

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('Failed to generate task')
  })
})
