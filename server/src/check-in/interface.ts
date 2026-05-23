import { Router } from 'express'
import { checkIn } from './service'

const router = Router()

router.post('/', async (req, res) => {
  const { visitorId, spotId } = req.body
  if (!visitorId || !spotId) {
    res.status(400).json({ error: 'visitorId and spotId required' })
    return
  }
  try {
    const result = await checkIn(visitorId, spotId)
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Check-in failed' })
  }
})

export default router
