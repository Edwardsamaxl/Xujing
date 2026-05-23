import { Router } from 'express'
import { generateTask, generateSpotNarrative } from './engine'
import { recommendSpot } from './route-planner'
import { handleVoiceChat } from './voice-bridge'

const router = Router()

router.post('/next-task', async (req, res) => {
  const { visitorId } = req.body
  if (!visitorId) {
    res.status(400).json({ error: 'visitorId required' })
    return
  }
  try {
    const task = await generateTask(visitorId)
    res.json(task)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate task' })
  }
})

// Explore 页面顶部弱推荐
router.post('/recommend', async (req, res) => {
  const { visitorId, currentSpotId } = req.body
  if (!visitorId) {
    res.status(400).json({ error: 'visitorId required' })
    return
  }
  try {
    const result = await recommendSpot(visitorId, currentSpotId || null)
    if (!result) {
      res.status(404).json({ error: 'No recommendation available' })
      return
    }
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate recommendation' })
  }
})

// 为指定点位生成叙事（含软导流钩子）
router.post('/task', async (req, res) => {
  const { visitorId, spotId, interestTag } = req.body
  if (!visitorId || !spotId) {
    res.status(400).json({ error: 'visitorId and spotId required' })
    return
  }
  try {
    const narrative = await generateSpotNarrative(visitorId, spotId, interestTag)
    res.json(narrative)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate narrative' })
  }
})

// 语音对话
router.post('/voice-chat', async (req, res) => {
  const { visitorId, spotId, transcript, conversationHistory, interestTag } = req.body
  if (!visitorId || !spotId || !transcript) {
    res.status(400).json({ error: 'visitorId, spotId and transcript required' })
    return
  }
  try {
    const result = await handleVoiceChat({
      visitorId,
      spotId,
      transcript,
      conversationHistory: conversationHistory || [],
      interestTag,
    })
    res.json(result)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Voice chat failed' })
  }
})

export default router
