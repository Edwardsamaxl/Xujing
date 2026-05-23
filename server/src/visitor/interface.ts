import { Router } from 'express'
import { createSession } from './session'

const router = Router()

router.post('/session', async (req, res) => {
  const { campaignId, interestTags } = req.body
  if (!campaignId || !Array.isArray(interestTags)) {
    res.status(400).json({ error: 'campaignId and interestTags required' })
    return
  }
  try {
    const session = await createSession(campaignId, interestTags)
    res.json(session)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

export default router
