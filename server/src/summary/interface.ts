import { Router } from 'express'
import { prisma } from '../data/prisma'

const router = Router()

router.get('/', async (req, res) => {
  const { visitorId } = req.query
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'visitorId required' })
    return
  }

  try {
    const visitor = await prisma.visitorSession.findUnique({
      where: { id: visitorId },
      include: { campaign: { include: { spots: true, rewards: true } } },
    })

    if (!visitor) {
      res.status(404).json({ error: 'Visitor not found' })
      return
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { visitorId },
      include: { spot: true },
      orderBy: { createdAt: 'asc' },
    })

    const spots = checkIns.map(c => ({
      id: c.spot.id,
      name: c.spot.name,
    }))

    const rewards = visitor.campaign.rewards.map(r => ({
      name: r.name,
      imageUrl: r.imageUrl,
    }))

    res.json({ spots, rewards })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to get summary' })
  }
})

export default router
