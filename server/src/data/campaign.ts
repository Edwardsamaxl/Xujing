import { prisma } from './prisma'

export async function getActiveCampaigns() {
  return prisma.campaign.findMany({ where: { status: 'active' } })
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: { spots: true, rewards: true },
  })
}
