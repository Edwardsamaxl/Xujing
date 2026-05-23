import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function checkIn(visitorId: string, spotId: string) {
  const record = await prisma.checkIn.create({
    data: { visitorId, spotId, method: 'button' },
  })

  await prisma.visitorSession.update({
    where: { id: visitorId },
    data: { currentSpotId: spotId },
  })

  const visitor = await prisma.visitorSession.findUnique({
    where: { id: visitorId },
    include: { campaign: { include: { spots: true } } },
  })
  const checkIns = await prisma.checkIn.findMany({ where: { visitorId } })
  const completedSpotIds = new Set(checkIns.map(c => c.spotId))
  const allSpots = visitor?.campaign.spots || []
  const allCompleted = allSpots.every(s => completedSpotIds.has(s.id))

  if (allCompleted && visitor) {
    await prisma.visitorSession.update({
      where: { id: visitorId },
      data: { rewardIssued: true },
    })
  }

  return {
    success: true,
    checkInId: record.id,
    rewardUnlocked: allCompleted,
  }
}
