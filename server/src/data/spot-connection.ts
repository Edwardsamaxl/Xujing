import { prisma } from './prisma'

export async function getConnectionsFrom(fromSpotId: string) {
  return prisma.spotConnection.findMany({
    where: { fromSpotId },
    include: { toSpot: true },
  })
}

export async function getConnection(fromSpotId: string, toSpotId: string) {
  return prisma.spotConnection.findFirst({
    where: { fromSpotId, toSpotId },
  })
}
