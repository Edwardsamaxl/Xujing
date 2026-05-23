import { Router } from 'express'
import { generateTask } from './engine'

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

export default router
