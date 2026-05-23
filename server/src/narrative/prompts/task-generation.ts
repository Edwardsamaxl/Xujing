interface ThreeStepContext {
  currentSpotName: string
  currentSpotFacts: string[]
  targetSpotName: string
  targetSpotTeaser: string
  connectionHookFact: string
  connectionPayoffText: string
  interestTag: string
  completedCount: number
  totalCount: number
  crowdStatus?: 'smooth' | 'moderate' | 'crowded'
  targetStatus?: string
  rewardHint?: string
}

function getToneInstruction(interestTag: string): string {
  const tones: Record<string, string> = {
    '历史': '语气庄重沉稳，以史实为骨，带时间纵深感',
    '建筑': '语气精确克制，善用空间比喻与尺度描述',
    '人物': '语气有温度，关注个体命运与情感细节',
    '亲子': '语气活泼亲切，多用设问和想象邀请',
    '悬疑': '语气神秘克制，善用反问和留白',
    '工艺': '语气专业精准，突出技术细节与匠人精神',
  }
  return tones[interestTag] || '语气自然流畅，有叙事张力'
}

export function buildThreeStepPrompt(ctx: ThreeStepContext): string {
  const {
    currentSpotName,
    currentSpotFacts,
    targetSpotName,
    targetSpotTeaser,
    connectionHookFact,
    connectionPayoffText,
    interestTag,
    completedCount,
    totalCount,
    crowdStatus,
    targetStatus,
    rewardHint,
  } = ctx

  const progress = `当前进度：${completedCount + 1}/${totalCount}`
  const tone = getToneInstruction(interestTag)

  let statusNotes = ''
  if (crowdStatus === 'crowded') {
    statusNotes += `\n【实时状态】${currentSpotName}目前人流较多，请在叙述中委婉暗示此处拥挤，为分流做铺垫。`
  }
  if (targetStatus === 'targeted' || targetStatus === 'normal') {
    statusNotes += `\n【导流提示】${targetSpotName}是推荐点位，目前相对安静，请在叙述中自然突出其独特体验。`
  }

  return `
你是故宫数字导览员"叙境"。请严格基于以下事实资料，用【${interestTag}】视角，为游客生成一段"软导流"叙事。

## 必须遵守的三步法结构
1. 【认知重构】基于当前馆事实，制造悬念或打破固有认知（30%）
2. 【疑点植入】用关联线索，自然指向目标馆（40%）
3. 【利益驱动】给出前往理由（人流/奖励/独家体验）（30%）

## 事实资料（严禁编造之外内容）
【当前馆：${currentSpotName}】
${currentSpotFacts.map(f => `- ${f}`).join('\n')}

【目标馆：${targetSpotName}】
- 简介：${targetSpotTeaser}

【两馆关联线索】
${connectionHookFact}

【利益点】
${connectionPayoffText}
${rewardHint ? `\n【奖励】${rewardHint}` : ''}
${statusNotes}

## 游客信息
- 兴趣标签：${interestTag}
- ${progress}

## 输出要求
- 总字数 180-220 字
- 第二人称"你"
- ${tone}
- 导流必须自然，禁止出现"请前往""下一个景点是""建议你马上去"等生硬表达
- 结尾句必须是行动暗示，但不能是祈使句
- 只输出叙事正文，不要标题和解释
`.trim()
}

export function buildVoicePrompt(ctx: {
  spotName: string
  facts: string[]
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  question: string
  interestTag: string
}): string {
  const { spotName, facts, history, question, interestTag } = ctx

  const historyText = history
    .slice(-6)
    .map(h => `${h.role === 'user' ? '游客' : '导览员'}：${h.content}`)
    .join('\n')

  return `
你是故宫数字导览员"叙叙"。你现在正在${spotName}为一位对"${interestTag}"感兴趣的游客讲解。

## 知识库（回答必须基于以下事实，严禁编造）
${facts.map(f => `- ${f}`).join('\n')}

## 对话历史
${historyText || '（暂无）'}

## 游客提问
${question}

## 回答要求
- 用第二人称"你"对话
- 语气亲切自然，像一位博学的老朋友
- 只使用知识库中的事实，不确定的内容直接说"史料未载"
- 如果游客的问题与当前点位无关，礼貌地引导回主题
- 控制在 80-120 字
- 不要加前缀或解释
`.trim()
}
