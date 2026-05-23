import { vi } from 'vitest'

vi.mock('../data/prisma', () => ({
  prisma: {
    visitorSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    checkIn: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    narrativeTemplate: {
      findUnique: vi.fn(),
    },
    spot: {
      findMany: vi.fn(),
    },
    campaign: {
      findUnique: vi.fn(),
    },
    reward: {
      findMany: vi.fn(),
    },
  },
}))
