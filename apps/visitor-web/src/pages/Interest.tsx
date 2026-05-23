import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setVisitorId, setInterestTag } from '../utils/storage'

interface StyleCard {
  id: string
  label: string
  subtitle: string
  icon: string
  description: string
}

const STYLE_CARDS: StyleCard[] = [
  {
    id: 'history',
    label: '历史',
    subtitle: 'History',
    icon: 'scroll',
    description: '朝代的更迭与权力的暗涌',
  },
  {
    id: 'architecture',
    label: '建筑',
    subtitle: 'Architecture',
    icon: 'temple',
    description: '黄瓦红墙间的营造密码',
  },
  {
    id: 'figure',
    label: '人物',
    subtitle: 'Figures',
    icon: 'crown',
    description: '帝王将相的恩怨情仇',
  },
  {
    id: 'family',
    label: '亲子',
    subtitle: 'Family',
    icon: 'lantern',
    description: '寓教于乐的宫廷探秘',
  },
  {
    id: 'mystery',
    label: '悬疑',
    subtitle: 'Mystery',
    icon: 'seal',
    description: '未解之谜与隐秘档案',
  },
  {
    id: 'craft',
    label: '工艺',
    subtitle: 'Craft',
    icon: 'brush',
    description: '巧夺天工的皇家技艺',
  },
]

const ICONS: Record<string, JSX.Element> = {
  scroll: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V3z" />
      <path d="M6 8h12" />
      <path d="M6 5h12" />
    </svg>
  ),
  temple: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 9h4" />
      <path d="M10 12h4" />
    </svg>
  ),
  crown: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20" />
      <path d="M4 18V9l4 3 4-6 4 6 4-3v9" />
    </svg>
  ),
  lantern: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 21V11" />
      <path d="M8 11h8v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-7z" />
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
    </svg>
  ),
  seal: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="3" width="12" height="14" rx="1" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
    </svg>
  ),
  brush: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 3a3 3 0 0 0-3 3c0 1.5.5 2 2 4s3 3 3 3a3 3 0 0 0 0-6" />
      <path d="M6 21l6-6" />
      <path d="M3 21h6" />
    </svg>
  ),
}

export default function Interest() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const toggle = (tag: string) => {
    setSelected((prev) => (prev === tag ? null : tag))
  }

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)

    try {
      const res = await fetch('/api/visitor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: 'demo', interestTags: [selected] }),
      })
      const data = await res.json()
      setVisitorId(data.id)
    } catch {
      setVisitorId('demo-' + Date.now())
    }

    setInterestTag(selected)
    navigate('/explore')
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
    <div
      className={`flex min-h-screen flex-col px-6 pt-12 pb-8 bg-paper transition-all duration-500 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="mx-auto w-full max-w-[400px]">
        {/* Header decoration */}
        <div className="w-12 h-px bg-gold/40 mb-6" />

        <h1 className="mb-2 font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink">
          择趣
        </h1>
        <p className="mb-8 text-[13px] leading-[1.6] text-ink-dim">
          选择你的探索偏好，决定密档的叙事风格
          <span className="text-ink-faint">（只能选 1 个）</span>
        </p>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {STYLE_CARDS.map((card, i) => {
            const isSelected = selected === card.label
            return (
              <button
                key={card.id}
                onClick={() => toggle(card.label)}
                className={`group relative text-left rounded-xl border p-4 transition-all duration-300 ${
                  isSelected
                    ? 'bg-cinnabar-light border-cinnabar shadow-[0_4px_16px_rgba(163,38,38,0.12)]'
                    : 'bg-paper-deep border-scroll-line hover:border-gold/40 hover:shadow-sm'
                }`}
                style={{
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {/* Top icon */}
                <div
                  className={`mb-3 transition-colors duration-300 ${
                    isSelected ? 'text-cinnabar' : 'text-ink-faint group-hover:text-gold'
                  }`}
                >
                  {ICONS[card.icon]}
                </div>

                {/* Label */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span
                    className={`text-[16px] font-medium font-display tracking-[0.04em] transition-colors ${
                      isSelected ? 'text-cinnabar' : 'text-ink'
                    }`}
                  >
                    {card.label}
                  </span>
                  <span className="text-[10px] text-ink-faint/60 tracking-wider uppercase">
                    {card.subtitle}
                  </span>
                </div>

                {/* Description */}
                <p
                  className={`text-[11px] leading-[1.5] transition-colors ${
                    isSelected ? 'text-cinnabar/70' : 'text-ink-faint'
                  }`}
                >
                  {card.description}
                </p>

                {/* Selected indicator dot */}
                <div
                  className={`absolute top-3 right-3 w-2 h-2 rounded-full transition-all duration-300 ${
                    isSelected ? 'bg-cinnabar scale-100' : 'bg-transparent scale-75'
                  }`}
                />

                {/* Bottom accent line */}
                <div
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${
                    isSelected ? 'w-12 bg-cinnabar' : 'w-0 bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Selected preview */}
        {selected && (
          <div className="mt-6 p-4 rounded-lg bg-gold-dim border border-gold/10 animate-ink-bleed">
            <p className="text-[12px] text-gold/70 mb-1 tracking-[0.04em]">已选偏好</p>
            <span className="text-[14px] text-gold font-medium">{selected}</span>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!selected}
          className="mt-10 h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.06em] transition-all duration-200 ease-out active:scale-[0.96] disabled:bg-ink-faint/20 disabled:text-ink-faint/40 disabled:active:scale-100 hover:shadow-[0_4px_16px_rgba(163,38,38,0.15)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          进入秘辛地图
        </button>
      </div>
    </div>
  )
}
