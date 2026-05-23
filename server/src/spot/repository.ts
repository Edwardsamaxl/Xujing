import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getSpotsByCampaign(campaignId: string) {
  return prisma.spot.findMany({
    where: { campaignId },
    orderBy: { sortOrder: 'asc' },
  })
}
