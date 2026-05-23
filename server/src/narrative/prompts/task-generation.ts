interface PromptContext {
  title: string
  baseContent: string
  flavorText: string
  spotName: string
  spotStatus: string
  interestTags: string[]
  completedSpotIds: string[]
  totalSpots: number
}

export function buildPrompt(ctx: PromptContext): string {
  const { title, baseContent, flavorText, spotName, spotStatus, interestTags, completedSpotIds, totalSpots } = ctx

  const progress = `当前进度：${completedSpotIds.length + 1}/${totalSpots}。`
  const interest = `游客兴趣标签：${interestTags.join('、')}。`
  const statusNote = spotStatus === 'crowded'
    ? `注意：${spotName}目前人流较多，请在叙述中委婉提示游客此处值得一看但可能需要耐心。`
    : ''
  const statusNote2 = spotStatus === 'targeted'
    ? `提示：${spotName}是运营方希望引导游客前往的点位，请在叙述中自然推荐此处的独特之处。`
    : ''

  return `
你是一位博物馆叙事导览员。请根据以下资料为游客生成一段个性化的剧情引导。

## 资料（严禁编造资料之外的内容）
- 标题：${title}
- 核心内容：${baseContent}
- 氛围描述：${flavorText}

## 游客信息
- ${interest}
- ${progress}
- 下一点位：${spotName}

## 特殊要求
${statusNote}
${statusNote2}

## 输出要求
1. 用第二人称"你"与游客对话。
2. 语气要符合兴趣标签（悬疑要神秘，亲子要活泼，历史要庄重）。
3. 将"前往${spotName}"的引导自然融入剧情，不要生硬地说"请去下一个点位"。
4. 只使用提供的资料，不要编造历史事实。
5. 控制在150字以内。

请直接输出叙述文本，不要加任何前缀或解释。
`.trim()
}
