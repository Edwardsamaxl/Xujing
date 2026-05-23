/**
 * 叙境数据层 — 奖励数据
 * =====================================
 * 与后端 rewards 表保持同步
 */

export interface Reward {
  id: string
  name: string
  type: 'badge' | 'souvenir'
  imageUrl?: string
  unlockText: string
  triggerCondition: string
}

export const REWARDS: Reward[] = [
  {
    id: 'reward-palace-explorer',
    name: '紫禁秘境探索者',
    type: 'badge',
    imageUrl: '/badges/palace-explorer.png',
    unlockText:
      '你穿越了六座故宫冷门宫殿，找到了被时光掩埋的隐藏线索。作为"紫禁秘境探索者"，你的名字已被写入密档。',
    triggerCondition: 'complete_all',
  },
]

export const REWARD_STYLES = [
  {
    id: 'album',
    className: 'reward-card-album',
    eyebrow: '延禧宫 · 灵沼轩',
    title: '水殿残图',
    subtitle: '你拼回了未建成水殿的一角',
    caption: '册页式 · 适合历史/人物线',
    tone: '宣纸、淡墨、朱砂题签',
  },
  {
    id: 'blueprint',
    className: 'reward-card-blueprint',
    eyebrow: '延禧宫 · 灵沼轩',
    title: '西洋水法构件',
    subtitle: '齿轮纹路与水殿铁件完成对照',
    caption: '蓝图式 · 适合建筑/工艺线',
    tone: '青绿底、银线、测绘标注',
  },
  {
    id: 'seal',
    className: 'reward-card-seal',
    eyebrow: '延禧宫 · 灵沼轩',
    title: '御苑密印',
    subtitle: '密信盖印，下一段线索已开启',
    caption: '印章式 · 适合悬疑/成就线',
    tone: '漆黑、金线、朱砂钤印',
  },
  {
    id: 'glaze',
    className: 'reward-card-glaze',
    eyebrow: '延禧宫 · 灵沼轩',
    title: '琉璃光片',
    subtitle: '光落在水面，显出隐藏的纹样',
    caption: '琉璃式 · 适合亲子/轻收集线',
    tone: '瓷白、湖绿、珊瑚点色',
  },
]
