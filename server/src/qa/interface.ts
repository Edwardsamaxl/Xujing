import { Router } from 'express'
import { answerQuestion } from './service'

const router = Router()

router.post('/ask', async (req, res) => {
  const { visitorId, currentSpotId, question } = req.body ?? {}
  if (!visitorId || typeof visitorId !== 'string') {
    res.status(400).json({ error: 'visitorId required' })
    return
  }
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'question required' })
    return
  }
  try {
    const result = await answerQuestion({
      visitorId,
      currentSpotId:
        typeof currentSpotId === 'string' && currentSpotId
          ? currentSpotId
          : undefined,
      question,
    })
    res.json(result)
  } catch (e) {
    console.error('[qa/ask]', e)
    // 把 DeepSeek 的常见错误码透传成可读 answer，前端能直接朗读出来
    const msg = e instanceof Error ? e.message : ''
    let answer = '抱歉，我刚才走神了，请您再问一遍。'
    if (msg.includes('402')) {
      answer =
        'DeepSeek 账户余额不足。请去 platform.deepseek.com 充值后再试。'
    } else if (msg.includes('401') || msg.includes('403')) {
      answer = 'DeepSeek API Key 无效，请检查后端 .env 配置。'
    } else if (msg.includes('429')) {
      answer = 'DeepSeek 请求过于频繁，请稍后再试。'
    } else if (msg.includes('empty content')) {
      answer = '模型暂时没有回答，请稍后再试。'
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT')) {
      answer = '网络连接不稳定，请检查网络后重试。'
    } else if (msg.includes('Visitor not found')) {
      res.status(404).json({ error: 'Visitor not found' })
      return
    }
    console.error('[qa/ask] Unmapped error:', msg)
    res.json({ answer })
  }
})

export default router
