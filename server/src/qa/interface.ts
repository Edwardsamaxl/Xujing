import { Router } from 'express'
import { answerQuestion } from './service'

const router = Router()

router.post('/ask', async (req, res) => {
  const { visitorId, currentSpotId, question } = req.body ?? {}
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'visitorId required' })
    return
  }
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'question required' })
    return
  }
  try {
    const result = await answerQuestion({
      visitorId,
      currentSpotId:
        typeof currentSpotId === 'string' && currentSpotId
          ? currentSpotId
          : undefined,
      question,
    })
    res.json(result)
  } catch (e) {
    console.error('[qa/ask]', e)
    res.status(500).json({ error: 'Failed to answer' })
  }
})

export default router
