import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function createSession(campaignId: string, interestTags: string[]) {
  return prisma.visitorSession.create({
    data: {
      campaignId,
      interestTags,
    },
  })
}
