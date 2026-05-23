import { prisma } from './prisma'

export async function getRewardsByCampaign(campaignId: string) {
  return prisma.reward.findMany({
    where: { campaignId },
  })
}

export async function getRewardById(id: string) {
  return prisma.reward.findUnique({
    where: { id },
  })
}
