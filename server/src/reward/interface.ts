import { Router } from 'express'
import { getReward } from './service'

const router = Router()

router.get('/', async (req, res) => {
  const { visitorId } = req.query
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'visitorId required' })
    return
  }
  try {
    const reward = await getReward(visitorId)
    res.json(reward)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to get reward' })
  }
})

export default router
