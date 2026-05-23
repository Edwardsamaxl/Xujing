import { prisma } from './prisma'

export async function createSession(campaignId: string, interestTags: string[]) {
  return prisma.visitorSession.create({
    data: { campaignId, interestTags },
  })
}

export async function getVisitorById(id: string) {
  return prisma.visitorSession.findUnique({
    where: { id },
    include: { campaign: { include: { spots: true, rewards: true } } },
  })
}

export async function updateVisitorCurrentSpot(id: string, spotId: string) {
  return prisma.visitorSession.update({
    where: { id },
    data: { currentSpotId: spotId },
  })
}

export async function markRewardIssued(id: string) {
  return prisma.visitorSession.update({
    where: { id },
    data: { rewardIssued: true },
  })
}
