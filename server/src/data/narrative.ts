import { prisma } from './prisma'

export async function getTemplate(spotId: string, interestTag: string) {
  return prisma.narrativeTemplate.findUnique({
    where: { spotId_interestTag: { spotId, interestTag } },
  })
}

export async function getTemplatesBySpot(spotId: string) {
  return prisma.narrativeTemplate.findMany({
    where: { spotId },
  })
}
