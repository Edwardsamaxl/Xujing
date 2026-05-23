import { prisma } from './prisma'

export async function createCheckIn(visitorId: string, spotId: string, method: string = 'button') {
  return prisma.checkIn.create({
    data: { visitorId, spotId, method },
  })
}

export async function getCheckInsByVisitor(visitorId: string) {
  return prisma.checkIn.findMany({
    where: { visitorId },
    orderBy: { createdAt: 'asc' },
  })
}
