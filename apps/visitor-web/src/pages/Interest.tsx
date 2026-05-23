import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TopNav from "../components/TopNav"
import { setVisitorId, setInterestTag } from "../utils/storage"

const CARD_ART: Record<
  string,
  {
    eyebrow: string
    secret: string
    detail: string
    archivalNote: string
    stamp: string
    stampSub: string
    accent: string
  }
> = {
  "历史": {
    eyebrow: "朝代更迭 · 权力暗涌",
    secret: "从紫禁城的第一块砖到末代皇帝的退位诏书，六百年宫廷史藏在每一道朱批里。",
    detail: "宫廷档案",
    archivalNote: "清宫起居注 · 朱批谕旨",
    stamp: "史",
    stampSub: "历史",
    accent: "#8C5A20",
  },
  "建筑": {
    eyebrow: "黄瓦红墙 · 营造密码",
    secret: "榫卯斗拱、风水堪舆，每一座殿宇都是凝固的音乐与权力的几何。",
    detail: "营造法式",
    archivalNote: "清工部工程做法则例",
    stamp: "建",
    stampSub: "建筑",
    accent: "#9F6D16",
  },
  "人物": {
    eyebrow: "帝王将相 · 恩怨情仇",
    secret: "权力巅峰的孤独、后宫深处的博弈，紫禁城因人而有温度，因人而血腥。",
    detail: "人物传记",
    archivalNote: "清史稿 · 列女传",
    stamp: "人",
    stampSub: "人物",
    accent: "#54677D",
  },
  "亲子": {
    eyebrow: "寓教于乐 · 宫廷探秘",
    secret: "从九龙壁的隐龙到屋脊上的骑凤仙人，故宫是一本最好玩的立体教科书。",
    detail: "趣味科普",
    archivalNote: "内务府造办处活计档",
    stamp: "亲",
    stampSub: "亲子",
    accent: "#66714B",
  },
  "悬疑": {
    eyebrow: "未解之谜 · 隐秘档案",
    secret: "太和殿的龙椅为何不用钉子？地宫之中究竟藏着什么？真相远比传说更离奇。",
    detail: "悬案调查",
    archivalNote: "内务府密档 · 未解卷宗",
    stamp: "疑",
    stampSub: "悬疑",
    accent: "#934C36",
  },
  "工艺": {
    eyebrow: "巧夺天工 · 皇家技艺",
    secret: "景泰蓝的釉色、剔红的刀法、缂丝的通经断纬，每一件器物都是时间的对手。",
    detail: "皇家工艺",
    archivalNote: "养心殿造办处各作成做活计清档",
    stamp: "工",
    stampSub: "工艺",
    accent: "#476F72",
  },
}

const INTEREST_CARD_BACKGROUNDS: Record<string, string> = {
  历史: "/assets/explore/history/history-card.png",
  建筑: "/assets/explore/architecture/architecture-card.png",
  人物: "/assets/explore/figure/figure-card.png",
  亲子: "/assets/explore/family/family-card.png",
  悬疑: "/assets/explore/mystery/mystery-card.png",
  工艺: "/assets/explore/craft/craft-card.png",
}

export default function Interest() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleCardClick = async (tag: string) => {
    setLoading(true)

    try {
      const res = await fetch("/api/visitor/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "campaign-palace-001",
          interestTags: [tag],
        }),
      })
      const data = await res.json()
      setVisitorId(data.id)
    } catch {
      setVisitorId("demo-" + Date.now())
    }

    setInterestTag(tag)
    navigate("/explore")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 bg-paper">
        <div className="flex gap-2 mb-4">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
        <p className="text-[13px] text-ink-dim tracking-[0.04em]">正在生成你的专属密档...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TopNav title="择趣" showBack onBack={() => navigate('/')} />
      <div
        className={`flex-1 flex flex-col px-5 pt-6 pb-8 transition-all duration-500 ease-out ${
          entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mx-auto w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[11px] text-gold tracking-[0.1em] font-serif uppercase mb-2">Onboarding · 偏好档案</p>
            <h1 className="font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink mb-2">
              择趣
            </h1>
            <p className="text-[13px] text-ink-dim leading-[1.6]">
              选择你的探索偏好，决定密档的叙事风格
              <span className="text-ink-faint">（点击卡片开始探索）</span>
            </p>
          </div>

          {/* Interest cards */}
          <div className="space-y-4">
            {Object.keys(CARD_ART).map((tag) => {
              const art = CARD_ART[tag]

              return (
                <button
                  key={tag}
                  onClick={() => handleCardClick(tag)}
                  className="group relative w-full overflow-hidden rounded-xl text-left transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  {/* Base paper texture */}
                  <div className="absolute inset-0 bg-[#f5f0e6]" />

                  {/* Background painting */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={INTEREST_CARD_BACKGROUNDS[tag]}
                      alt=""
                      className="h-full w-full object-cover object-right"
                      style={{ transform: "scale(1.06)", opacity: 0.9 }}
                    />
                  </div>

                  {/* Content mask: left area for text */}
                  <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-[#f5f0e6] via-[#f5f0e6] to-transparent" />

                  {/* Left vertical bookmark */}
                  <div className="absolute left-[2.8%] top-[7%] bottom-[7%] w-[9.5%] bg-[#8B2E2E] rounded-sm flex flex-col items-center justify-center shadow-sm">
                    {art.stampSub.split('').map((char, i) => (
                      <span key={i} className="font-display text-[13px] text-[#f4ead8] leading-tight py-[1px]">
                        {char}
                      </span>
                    ))}
                  </div>

                  {/* Main text content */}
                  <div className="absolute inset-y-0 left-[16%] right-[22%] flex flex-col justify-center py-3">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <p className="text-[10px] font-medium tracking-[0.12em]" style={{ color: art.accent }}>
                          {art.eyebrow}
                        </p>
                      </div>

                      <h3
                        className="font-display text-[18px] leading-tight tracking-[0.02em]"
                        style={{
                          color: "#1a0f05",
                          textShadow: "0 1px 2px rgba(245,240,230,0.9)",
                        }}
                      >
                        {tag}
                      </h3>

                      <p
                        className="mt-1.5 text-[12px] leading-[1.55]"
                        style={{
                          color: "#3d2e20",
                          textShadow: "0 1px 2px rgba(245,240,230,0.9)",
                        }}
                      >
                        {art.secret}
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <p className="text-[9px] tracking-[0.1em]" style={{ color: "#7a6a5a" }}>
                        {art.archivalNote}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border bg-[#fff8e8]/70 px-2 py-0.5 text-[9px] font-medium backdrop-blur-sm"
                          style={{ borderColor: `${art.accent}44`, color: art.accent }}
                        >
                          {art.detail}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seal stamp — bottom right */}
                  <div
                    className="absolute right-[8%] bottom-[9%] h-[23%] aspect-square flex flex-col items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: "#A32626",
                      color: "#A32626",
                    }}
                  >
                    <span className="absolute inset-1 rounded-full border border-current opacity-40" />
                    <span className="font-display text-[16px] leading-none">
                      {art.stamp}
                    </span>
                    <span className="mt-0.5 text-[7px] font-medium tracking-[0.14em]">
                      {art.stampSub}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
