import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { SPOTS, getAllSpots, getCrowdLevel } from '../data/spots'
import { getCompletedSpots, getCurrentTarget, setCurrentTarget } from '../utils/storage'
import { getRemainingSpots, getRecommendedSpot, getRandomUnexploredSpot } from '../utils/route-planner'

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
  'spot-clock': {
    eyebrow: '铜壶滴漏 · 自鸣钟',
    secret: '齿轮、滴漏与远洋贡品，把宫廷时间校准在同一声钟响里。',
    detail: '机械纹样',
    archivalNote: '康熙造办处钟表档',
    stamp: '时',
    stampSub: '钟表',
    accent: '#8C5A20',
  },
  'spot-treasure': {
    eyebrow: '金瓯永固 · 田黄三连章',
    secret: '金、翠、田黄与象牙编织成乾隆未曾入住的退隐幻境。',
    detail: '宝光切面',
    archivalNote: '乾隆宁寿宫藏宝录',
    stamp: '宝',
    stampSub: '珍藏',
    accent: '#9F6D16',
  },
  'spot-ceramic': {
    eyebrow: '八千年窑火 · 青花粉彩',
    secret: '土坯入窑，釉色出火，武英殿里藏着一条文明的蓝白火线。',
    detail: '瓷片釉裂',
    archivalNote: '武英殿窑器总册',
    stamp: '瓷',
    stampSub: '窑火',
    accent: '#476F72',
  },
  'spot-yanxi': {
    eyebrow: '灵沼轩 · 水晶宫遗梦',
    secret: '钢筋、玻璃与未完成的水殿，停在帝国终章的施工现场。',
    detail: '西洋窗格',
    archivalNote: '光绪三十六年营造档',
    stamp: '沼',
    stampSub: '延禧',
    accent: '#54677D',
  },
  'spot-shoukang': {
    eyebrow: '崇庆皇太后 · 颐养之所',
    secret: '低门槛、暖采光、紫檀家具，都是乾隆写给母亲的长寿注脚。',
    detail: '寿字窗棂',
    archivalNote: '乾隆元年寿康宫案卷',
    stamp: '寿',
    stampSub: '颐养',
    accent: '#934C36',
  },
  'spot-cining': {
    eyebrow: '太后正宫 · 雕塑馆',
    secret: '从太后礼佛的庭院到历代造像，慈宁宫把权力沉成石与铜。',
    detail: '石雕花园',
    archivalNote: '慈宁宫礼佛陈设档',
    stamp: '宁',
    stampSub: '慈宁',
    accent: '#66714B',
  },
}

function CardMotif({ spotId, color }: { spotId: string; color: string }) {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  if (spotId === 'spot-clock') {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx="70" cy="48" r="22" {...common} />
        <circle cx="70" cy="48" r="5" fill={color} opacity="0.35" />
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 10
          const x1 = 70 + Math.cos(angle) * 28
          const y1 = 48 + Math.sin(angle) * 28
          const x2 = 70 + Math.cos(angle) * 34
          const y2 = 48 + Math.sin(angle) * 34
          return <path key={i} d={`M${x1} ${y1}L${x2} ${y2}`} {...common} />
        })}
        <path d="M46 84c8-18 28-19 36 0M58 70h12M64 26v22l13 8" {...common} />
      </svg>
    )
  }

  if (spotId === 'spot-treasure') {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <path d="M36 48 52 30h34l16 18-33 40Z" {...common} />
        <path d="M36 48h66M52 30l17 58M86 30 69 88M52 30l17 18 17-18" {...common} />
        <circle cx="36" cy="78" r="7" {...common} />
        <circle cx="92" cy="77" r="5" fill={color} opacity="0.18" />
      </svg>
    )
  }

  if (spotId === 'spot-ceramic') {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <path d="M42 33c10 8 36 8 46 0v15c0 21-8 39-23 39S42 69 42 48Z" {...common} />
        <path d="M45 51c10 7 30 7 40 0M46 63c11 8 27 8 38 0" {...common} />
        <path d="M58 38c-3 7 4 11 0 19M72 37c4 6-3 12 2 18" {...common} opacity="0.55" />
      </svg>
    )
  }

  if (spotId === 'spot-yanxi') {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <path d="M37 91V36l11-12h42l11 12v55" {...common} />
        <path d="M49 91V42h40v49M49 58h40M49 74h40M69 42v49M37 91h64" {...common} />
        <path d="M58 24c4 7 18 7 22 0" {...common} opacity="0.55" />
      </svg>
    )
  }

  if (spotId === 'spot-shoukang') {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <path d="M38 36h64v51H38zM50 36v51M90 36v51M38 53h64M38 70h64" {...common} />
        <path d="M64 61c0-9 14-9 14 0 0 10-14 12-14 22 0-10-14-12-14-22 0-9 14-9 14 0Z" {...common} />
        <path d="M50 28h40" {...common} opacity="0.55" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <path d="M46 82c18-1 34-11 43-29M40 87c17 2 40-4 58-20" {...common} />
      <path d="M50 43c8-12 26-12 34 0 6 9 2 22-10 27l-8 3-8-3C46 65 44 52 50 43Z" {...common} />
      <path d="M66 33v42M53 52h26" {...common} opacity="0.55" />
      <circle cx="42" cy="78" r="4" fill={color} opacity="0.2" />
    </svg>
  )
}

export default function Explore() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [spots] = useState(getAllSpots())
  const [currentTarget, setCurrentTargetState] = useState(getCurrentTarget())

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  const completed = getCompletedSpots()
  const completedSet = new Set(completed)
  const remaining = getRemainingSpots()
  const recommended = getRecommendedSpot()

  const handleSelectSpot = (spotId: string) => {
    if (completedSet.has(spotId)) return
    setCurrentTarget(spotId)
    setCurrentTargetState(spotId)
    navigate(`/navigate?spotId=${spotId}`)
  }

  const handleRandom = () => {
    const spotId = getRandomUnexploredSpot()
    if (spotId) {
      setCurrentTarget(spotId)
      setCurrentTargetState(spotId)
      navigate(`/navigate?spotId=${spotId}`)
    }
  }

  const getStatus = (spotId: string): 'completed' | 'active' | 'pending' => {
    if (completedSet.has(spotId)) return 'completed'
    if (currentTarget === spotId) return 'active'
    return 'pending'
  }

  return (
    <div className={`flex min-h-screen flex-col px-5 pt-10 pb-8 transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="mx-auto w-full max-w-[400px]">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[11px] text-gold tracking-[0.1em] font-serif uppercase mb-2">Explore · 秘辛地图</p>
          <h1 className="font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink mb-2">
            选关中枢
          </h1>
          <p className="text-[13px] text-ink-dim leading-[1.6]">
            {remaining.length === 0
              ? '全部点位已勘验，可前往结案'
              : `剩余 ${remaining.length} 处未探索 · 点击卡片开始勘验`}
          </p>
        </div>

        {/* Weak recommendation */}
        {recommended && remaining.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-paper-deep border border-gold/20 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0" />
            <p className="text-[12px] text-ink-dim">
              轻量提示：<span className="text-ink font-medium">{SPOTS[recommended]?.name}</span> 当前人流较少，可优先前往
            </p>
          </div>
        )}

        {/* Spot cards */}
        <div className="space-y-3 mb-6">
          {spots.map((spot) => {
            const status = getStatus(spot.id)
            const crowd = getCrowdLevel(spot.id)
            const isClickable = status !== 'completed'
            const art = CARD_ART[spot.id]

            return (
              <button
                key={spot.id}
                onClick={() => isClickable && handleSelectSpot(spot.id)}
                disabled={!isClickable}
                className={`group relative w-full overflow-hidden rounded-lg border p-0 text-left transition-all duration-200 ${
                  status === 'completed'
                    ? 'border-scroll-line/50 opacity-75'
                    : status === 'active'
                      ? 'border-cinnabar/50 shadow-[0_8px_24px_rgba(163,38,38,0.10)]'
                      : 'border-[#b9954d]/55 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(43,41,38,0.08)]'
                }`}
              >
                <div
                  className={`relative min-h-[176px] bg-[#f4ead8] ${
                    status === 'completed' ? 'grayscale-[0.25]' : ''
                  }`}
                >
                  <div className="pointer-events-none absolute inset-[5px] rounded-[10px] border border-[#d9bd7b]/70" />
                  <div className="pointer-events-none absolute inset-[9px] rounded-[8px] border border-[#806022]/20" />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.2]"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 24% 18%, rgba(128,96,34,0.16) 0 1px, transparent 1px), radial-gradient(circle at 78% 72%, rgba(43,41,38,0.10) 0 1px, transparent 1px)',
                      backgroundSize: '17px 17px, 23px 23px',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.42),rgba(255,255,255,0)_42%),radial-gradient(ellipse_at_bottom_right,rgba(128,96,34,0.14),transparent_46%)]" />

                  <div className="relative grid min-h-[176px] grid-cols-[48px_minmax(0,1fr)_84px] gap-3 px-4 py-4">
                    <div className="flex items-center justify-center">
                      <div className="flex h-[132px] w-[34px] flex-col items-center justify-between rounded-[8px] border border-[#c5964a]/70 bg-[#8f2f24] px-1.5 py-3 shadow-[inset_0_0_0_1px_rgba(255,221,151,0.22)]">
                        <span className="font-display text-[20px] leading-none text-[#e1c47f]">{art.stamp}</span>
                        <span className="writing-vertical font-display text-[13px] leading-none tracking-[0.18em] text-[#e8d29a]">
                          {spot.shortName}
                        </span>
                        <span className="h-4 w-4 rounded-[3px] border border-[#d6b66f]/70 text-[8px] leading-[14px] text-[#d6b66f]">
                          印
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 pt-1">
                      <div className="mb-2 flex min-h-[18px] items-center gap-2">
                        <span className="truncate text-[10px] font-medium tracking-[0.12em] text-[#835f28]">
                          {art.eyebrow}
                        </span>
                        {status === 'active' && (
                          <span className="shrink-0 rounded-full bg-cinnabar/10 px-2 py-0.5 text-[10px] font-medium text-cinnabar">
                            探索中
                          </span>
                        )}
                      </div>

                      <h3 className={`font-display text-[21px] leading-[1.18] tracking-[0.03em] ${status === 'completed' ? 'text-ink-faint' : 'text-ink'}`}>
                        {spot.name}
                      </h3>

                      <p className={`mt-2 text-[13px] leading-[1.55] ${status === 'completed' ? 'text-ink-faint/70' : 'text-ink-dim'}`}>
                        {art.secret}
                      </p>

                      <div className="mt-3 border-t border-[#b89a61]/30 pt-2">
                        <p className="text-[10px] tracking-[0.12em] text-[#7d735f]">
                          {art.archivalNote}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full border bg-[#fff8e8]/60 px-2 py-0.5 text-[10px] font-medium"
                          style={{ borderColor: `${art.accent}44`, color: art.accent }}
                        >
                          {art.detail}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e8]/60 px-2 py-0.5 text-[10px] text-ink-faint">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            crowd === 'smooth' ? 'bg-emerald-500' : crowd === 'moderate' ? 'bg-amber-500' : 'bg-cinnabar'
                          }`} />
                          {crowd === 'smooth' ? '人流平稳' : crowd === 'moderate' ? '人流中等' : '较拥挤'}
                        </span>
                      </div>
                    </div>

                    <div className="relative flex flex-col items-center justify-between border-l border-[#b89a61]/25 pl-2">
                      <div className="mt-1 h-[78px] w-[78px] opacity-75 transition-transform duration-300 group-hover:scale-[1.03]">
                        <CardMotif spotId={spot.id} color={art.accent} />
                      </div>

                      <div
                        className={`relative flex h-[58px] w-[58px] rotate-[-10deg] flex-col items-center justify-center rounded-full border-2 bg-[#f8edd6]/55 ${
                          status === 'completed' ? 'border-cinnabar/70 text-cinnabar' : 'border-current'
                        }`}
                        style={{ color: status === 'completed' ? undefined : art.accent }}
                      >
                        <span className="absolute inset-1 rounded-full border border-current opacity-45" />
                        <span className="font-display text-[21px] leading-none">{status === 'completed' ? '勘' : art.stamp}</span>
                        <span className="mt-0.5 text-[8px] font-medium tracking-[0.14em]">{status === 'completed' ? '已勘' : art.stampSub}</span>
                      </div>
                    </div>

                    {status === 'completed' && (
                      <span className="absolute right-5 top-5 rounded-full bg-cinnabar/10 px-2 py-0.5 text-[10px] font-medium text-cinnabar">
                        已盖章
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Random explore */}
        {remaining.length > 0 && (
          <button
            onClick={handleRandom}
            className="h-12 w-full rounded-full border border-gold text-gold bg-transparent text-[15px] font-medium tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98] hover:bg-gold/5"
          >
            随机探索
          </button>
        )}

        {remaining.length === 0 && (
          <button
            onClick={() => navigate('/complete')}
            className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98]"
          >
            查看结案卷宗
          </button>
        )}
      </div>
    </div>
  )
}
