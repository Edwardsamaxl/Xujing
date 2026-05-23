import { Router } from 'express'
import { createSession } from './session'
import { getCampaignById } from '../data/campaign'
import { prisma } from '../data/prisma'

const router = Router()

/**
 * 兜底解析 campaignId：
 * - 传入存在的 id → 直接用
 * - 传入不存在的占位（如旧版前端 'demo'）→ 自动 fallback 到数据库里第一个 campaign
 *   避免外键约束失败导致整个流程卡死
 */
async function resolveCampaignId(requested: string): Promise<string | null> {
  const exists = await getCampaignById(requested)
  if (exists) return exists.id
  const fallback = await prisma.campaign.findFirst({
    orderBy: { createdAt: 'asc' },
  })
  return fallback?.id ?? null
}

router.post('/session', async (req, res) => {
  const { campaignId, interestTags } = req.body
  if (!campaignId || !Array.isArray(interestTags)) {
    res.status(400).json({ error: 'campaignId and interestTags required' })
    return
  }
  try {
    const realId = await resolveCampaignId(String(campaignId))
    if (!realId) {
      res
        .status(503)
        .json({ error: 'No campaign seeded. Run npm run db:seed first.' })
      return
    }
    const session = await createSession(realId, interestTags)
    res.json(session)
  } catch (e) {
    console.error('[visitor/session]', e)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

export default router
