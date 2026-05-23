import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getReward(visitorId: string) {
  const visitor = await prisma.visitorSession.findUnique({
    where: { id: visitorId },
    include: { campaign: { include: { rewards: true } } },
  })

  if (!visitor || !visitor.rewardIssued) {
    return null
  }

  return visitor.campaign.rewards[0] || null
}
