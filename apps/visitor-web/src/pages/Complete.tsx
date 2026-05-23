import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVisitorId, clearVisitor, getCompletedSpots } from '../utils/storage'
import { SPOTS } from '../data/spots'

interface RouteSummary {
  spots: { name: string; id: string }[]
  rewards: { name: string; imageUrl?: string }[]
}

const MOCK_SUMMARY: RouteSummary = {
  spots: [
    { name: '钟表馆', id: 'spot-clock' },
    { name: '珍宝馆', id: 'spot-treasure' },
    { name: '武英殿·陶瓷馆', id: 'spot-ceramic' },
    { name: '延禧宫', id: 'spot-yanxi' },
    { name: '寿康宫', id: 'spot-shoukang' },
    { name: '慈宁宫', id: 'spot-cining' },
  ],
  rewards: [
    { name: '钟表馆密档' },
    { name: '寿康宫密档' },
    { name: '慈宁宫密档' },
  ],
}

const ROUTES = [
  { id: 'deep', name: '深度考古线' },
  { id: 'full', name: '全域打卡线' },
  { id: 'express', name: '限时速览线' },
]

const SOUVENIRS = [
  { name: '故宫折扇', price: '¥68' },
  { name: '千里江山图丝巾', price: '¥128' },
  { name: '紫禁祥瑞书签', price: '¥39' },
]

export default function Complete() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<RouteSummary | null>(null)
  const [entered, setEntered] = useState(false)
  const completedSpots = getCompletedSpots()
  const completedSet = new Set(completedSpots)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    fetch(`/api/summary?visitorId=${visitorId}`)
      .then((r) => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then((data) => {
        setSummary(data)
        setTimeout(() => setEntered(true), 50)
      })
      .catch(() => {
        setSummary(MOCK_SUMMARY)
        setTimeout(() => setEntered(true), 50)
      })
  }, [navigate])

  const handleRestart = () => {
    clearVisitor()
    navigate('/')
  }

  const spots = summary?.spots ?? []
  const rewards = summary?.rewards ?? []

  // Duoboge grid: 3x3 layout with varying sizes
  const GRID_ITEMS = [
    { id: 'spot-clock', size: 'large' },
    { id: 'spot-treasure', size: 'small' },
    { id: 'spot-ceramic', size: 'small' },
    { id: 'spot-yanxi', size: 'small' },
    { id: 'spot-shoukang', size: 'large' },
    { id: 'spot-cining', size: 'small' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-paper px-5 pt-10 pb-8">
      <div className={`mx-auto w-full max-w-[480px] transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Scroll header decoration */}
        <div className="relative h-[80px] overflow-hidden rounded-t-xl mb-6 bg-gradient-to-b from-paper-deep via-paper to-paper">
          <img src="/assets/digital-archive/reward-scroll-header.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-multiply" />
          <div className="absolute inset-0 flex items-end justify-center pb-3">
            <p className="text-gold/80 text-[11px] tracking-[0.15em] font-serif uppercase">结案卷宗</p>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-gold-shimmer font-display text-[26px] text-center mb-2">
          叙境寻踪 · 已结案
        </h1>

        <p className="text-center text-[14px] leading-[1.6] text-ink-dim mb-1">
          你穿越了 {spots.length} 座宫殿，收集了 {rewards.length} 张密档卡片
        </p>

        {/* Duobaoge Medal Wall - 3x3 Grid */}
        <div className="mb-8 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-gold/60 rounded-full" />
            <span className="text-[13px] text-gold/80 tracking-[0.04em] font-display">多宝格藏宝阁</span>
          </div>

          {/* Wooden texture background placeholder */}
          <div className="rounded-xl border border-scroll-line/50 bg-paper-deep p-4"
            style={{ background: 'linear-gradient(135deg, #EFEBE1 0%, #E8E4DA 100%)' }}
          >
            <div className="grid grid-cols-3 gap-2">
              {GRID_ITEMS.map((item) => {
                const isUnlocked = completedSet.has(item.id)
                const spot = SPOTS[item.id]
                if (!spot) return null

                if (item.size === 'large') {
                  return (
                    <div key={item.id} className="col-span-1 row-span-2">
                      {isUnlocked ? (
                        <div className="h-full rounded-lg border border-gold/30 bg-paper flex flex-col items-center justify-center p-3 shadow-sm"
                          style={{ minHeight: '140px' }}
                        >
                          {/* Medal placeholder */}
                          <div className="w-12 h-12 rounded-full border-2 border-gold/40 flex items-center justify-center mb-2 bg-gradient-to-br from-paper-deep to-paper">
                            <span className="text-gold font-display text-sm">{spot.shortName.charAt(0)}</span>
                          </div>
                          <p className="text-[12px] font-display text-ink text-center">{spot.name}</p>
                          <div className="mt-2 w-6 h-6 rounded-full border border-cinnabar/40 flex items-center justify-center rotate-[-12deg]">
                            <span className="text-cinnabar/70 font-display text-[7px]">勘</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg border border-dashed border-scroll-line/40 bg-paper/50 flex flex-col items-center justify-center" style={{ minHeight: '140px' }}>
                          <span className="text-ink-faint/30 text-xl">?</span>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={item.id} className="col-span-1">
                    {isUnlocked ? (
                      <div className="rounded-lg border border-gold/20 bg-paper flex flex-col items-center justify-center p-2 shadow-sm" style={{ minHeight: '66px' }}>
                        <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center mb-1 bg-gradient-to-br from-paper-deep to-paper">
                          <span className="text-gold/80 font-display text-[10px]">{spot.shortName.charAt(0)}</span>
                        </div>
                        <p className="text-[10px] text-ink text-center leading-tight">{spot.name}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-scroll-line/40 bg-paper/50 flex items-center justify-center" style={{ minHeight: '66px' }}>
                        <span className="text-ink-faint/20 text-sm">?</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Route review */}
        <div className="card-elevated rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-gold/60 rounded-full" />
            <span className="text-[13px] text-gold/80 tracking-[0.04em] font-display">路线回顾</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-[13px] text-ink-dim">
            {spots.map((spot, i) => (
              <span key={spot.id} className="flex items-center">
                <span className={`${completedSet.has(spot.id) ? 'text-ink font-medium' : ''}`}>{spot.name}</span>
                {i < spots.length - 1 && (
                  <svg className="mx-1 h-3 w-3 text-ink-faint/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Souvenirs */}
        <div className="card-elevated rounded-xl p-5 mt-6 mb-6">
          <p className="text-gold font-medium text-[15px] mb-4">为你推荐的故宫文创</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
            {SOUVENIRS.map((item) => (
              <div key={item.name} className="w-[120px] flex-shrink-0">
                <div className="aspect-square bg-paper-deep rounded-lg mb-2" />
                <p className="text-[12px] text-ink font-medium truncate">{item.name}</p>
                <p className="text-[11px] text-gold">{item.price}</p>
              </div>
            ))}
          </div>
          <button className="mt-3 h-10 w-full rounded-full bg-cinnabar text-white text-[13px] font-medium transition-all active:scale-[0.96]">
            去购买
          </button>
        </div>

        {/* Route switch */}
        <div className="flex gap-2 mb-6">
          {ROUTES.map((route) => (
            <button
              key={route.id}
              className="flex-1 h-10 px-2 rounded-full border border-scroll-line text-[13px] text-ink-dim hover:border-cinnabar hover:text-cinnabar transition-all"
            >
              {route.name}
            </button>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => alert('纪念卡生成中...')}
            className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-[0_4px_20px_rgba(163,38,38,0.25)]"
          >
            生成纪念卡
          </button>

          <button
            onClick={handleRestart}
            className="h-12 w-full rounded-full border border-cinnabar bg-transparent text-[15px] font-medium text-cinnabar tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.96]"
          >
            再探一次
          </button>
        </div>
      </div>
    </div>
  )
}
