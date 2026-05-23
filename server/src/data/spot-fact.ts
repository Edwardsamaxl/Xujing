import { prisma } from './prisma'

export async function getFactsBySpot(spotId: string) {
  return prisma.spotFact.findMany({
    where: { spotId },
    orderBy: { weight: 'desc' },
  })
}

export async function getTopFactsBySpot(spotId: string, limit = 3) {
  return prisma.spotFact.findMany({
    where: { spotId },
    orderBy: { weight: 'desc' },
    take: limit,
  })
}
