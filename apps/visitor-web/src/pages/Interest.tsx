import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setVisitorId, setInterestTag } from '../utils/storage'
import { Button } from '../components/Button'

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
    icon: 'figure',
    description: '帝王将相的恩怨情仇',
  },
  {
    id: 'family',
    label: '亲子',
    subtitle: 'Family',
    icon: 'balloon',
    description: '寓教于乐的宫廷探秘',
  },
  {
    id: 'mystery',
    label: '悬疑',
    subtitle: 'Mystery',
    icon: 'search',
    description: '未解之谜与隐秘档案',
  },
  {
    id: 'craft',
    label: '工艺',
    subtitle: 'Craft',
    icon: 'fan',
    description: '巧夺天工的皇家技艺',
  },
]

const ICONS: Record<string, JSX.Element> = {
  scroll: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
      <path d="M7 2v20" />
      <path d="M17 2v20" />
      <path d="M7 7h10" />
      <path d="M7 11h10" />
      <path d="M7 15h6" />
    </svg>
  ),
  temple: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10l10-7 10 7" />
      <path d="M4 10v11" />
      <path d="M20 10v11" />
      <path d="M2 21h20" />
      <path d="M8 21v-5h8v5" />
      <path d="M8 16h8" />
    </svg>
  ),
  figure: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 21c0-4 3-6.5 6-6.5s6 2.5 6 6.5" />
    </svg>
  ),
  balloon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5.5 5.5 0 0 1 5.5 5.5c0 2.8-2.2 5.5-5.5 7-3.3-1.5-5.5-4.2-5.5-7A5.5 5.5 0 0 1 12 2z" />
      <path d="M12 14.5v7" />
      <path d="M10 21.5h4" />
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  fan: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c6 6 8.5 11 8.5 15h-17C3.5 13 6 8 12 2z" />
      <path d="M12 2v15" />
      <path d="M6.5 17 12 6l5.5 11" />
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
        body: JSON.stringify({
          campaignId: 'campaign-palace-001',
          interestTags: [selected],
        }),
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

        <Button
          variant="primary"
          fullWidth
          onClick={handleStart}
          disabled={!selected}
          className="mt-10"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          进入秘辛地图
        </Button>
      </div>
    </div>
  )
}
