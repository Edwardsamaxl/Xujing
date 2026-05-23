import { prisma } from './prisma'

export async function getSpotsByCampaign(campaignId: string) {
  return prisma.spot.findMany({
    where: { campaignId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function getSpotById(id: string) {
  return prisma.spot.findUnique({
    where: { id },
    include: { templates: true },
  })
}
