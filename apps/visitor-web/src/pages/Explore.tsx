import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import TopNav from '../components/TopNav'
import { getAllSpots, getCrowdLevel, getEdge, getSpotById } from '../data/spots'
import { getCompletedSpots, getCurrentTarget, setCurrentTarget, getInterestTag, getVisitorId, setVisitorId, removeVisitorId } from '../utils/storage'
import { getRemainingSpots, getRandomUnexploredSpot } from '../utils/route-planner'
import { fetchRecommendation, type RecommendResult } from '../api/recommend'
import { Button } from '../components/Button'

interface CardArt {
  eyebrow: string
  secret: string
  detail: string
  archivalNote: string
  stamp: string
  stampSub: string
  accent: string
}

const CARD_ART: Record<string, CardArt> = {
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

const INTEREST_CARD_BACKGROUNDS: Record<string, string> = {
  历史: '/assets/explore/history/history-card.png',
  建筑: '/assets/explore/architecture/architecture-card.png',
  人物: '/assets/explore/figure/figure-card.png',
  亲子: '/assets/explore/family/family-card.png',
  悬疑: '/assets/explore/mystery/mystery-card.png',
  工艺: '/assets/explore/craft/craft-card.png',
}

const FALLBACK_BG = '/assets/explore/history/history-card.png'

export default function Explore() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [spots] = useState(getAllSpots())
  const [currentTarget, setCurrentTargetState] = useState(getCurrentTarget())
  const [recommendation, setRecommendation] = useState<RecommendResult | null>(null)
  const interestTag = getInterestTag()

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const createSession = () => {
      const tag = getInterestTag()
      fetch('/api/visitor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: 'campaign-palace-001', interestTags: [tag] }),
      })
        .then(res => res.json())
        .then(data => {
          setVisitorId(data.id)
          return fetchRecommendation({ visitorId: data.id })
        })
        .then(r => setRecommendation(r))
        .catch(() => setRecommendation(null))
    }

    const visitorId = getVisitorId()
    if (visitorId) {
      fetchRecommendation({ visitorId })
        .then(r => {
          if (r === null) {
            // 后端不认识这个 ID（404），清除后重新创建 session
            removeVisitorId()
            createSession()
          } else {
            setRecommendation(r)
          }
        })
        .catch(() => setRecommendation(null))
      return
    }

    createSession()
  }, [])

  const completed = getCompletedSpots()
  const completedSet = new Set(completed)
  const remaining = getRemainingSpots()

  const effectiveRecommendation = useMemo(() => {
    if (!recommendation) return null
    if (!completedSet.has(recommendation.spotId)) return recommendation

    const localRemaining = getRemainingSpots()
    if (localRemaining.length === 0) return null

    const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null
    let bestId = localRemaining[0]
    let minWalkTime = Infinity

    for (const id of localRemaining) {
      const edge = lastCompleted ? getEdge(lastCompleted, id) : undefined
      const walkTime = edge?.walkTime ?? 10
      if (walkTime < minWalkTime) {
        minWalkTime = walkTime
        bestId = id
      }
    }

    const spot = getSpotById(bestId)
    if (!spot) return null

    const edge = lastCompleted ? getEdge(lastCompleted, bestId) : undefined

    return {
      spotId: bestId,
      spotName: spot.name,
      reason: `此刻${spot.name}人少路近，可优先前往探索。`,
      distance: edge?.distance ?? 500,
      walkTime: edge?.walkTime ?? 8,
      isNearby: (edge?.distance ?? 500) < 150,
    } as RecommendResult
  }, [recommendation, completed, completedSet])

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
    <div className="flex min-h-screen flex-col">
      <TopNav title="选关中枢" showBack onBack={() => navigate('/interest')} showAchievement />
      <div className={`flex-1 flex flex-col px-5 pt-6 pb-8 transition-[opacity,transform] duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="mx-auto w-full max-w-[400px]">
          {/* Header */}
          <div className="mb-6">
            <p className="text-[11px] text-gold tracking-[0.1em] font-serif uppercase mb-2">Explore · 秘辛地图</p>
            <h1 className="font-display text-[28px] leading-[1.3] tracking-[0.04em] text-ink mb-2">
              选关中枢
            </h1>
            <p className="text-[12px] text-ink-dim leading-[1.6]">
              {remaining.length === 0
                ? '全部点位已勘验，可前往结案'
                : `剩余 ${remaining.length} 处未探索 · 点击卡片开始勘验`}
            </p>
          </div>

        {/* Weak recommendation */}
        {effectiveRecommendation && remaining.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-paper-deep border border-gold/20 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse flex-shrink-0 mt-1.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-ink-dim leading-[1.6]">
                {effectiveRecommendation.reason}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleSelectSpot(effectiveRecommendation.spotId)}
                  className="text-[11px] px-2.5 h-10 rounded-full bg-gold/10 text-gold font-medium transition-colors hover:bg-gold/20 flex items-center"
                >
                  去看看
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spot cards */}
        <div className="space-y-4 mb-6 animate-stagger">
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
                className={`group relative w-full overflow-hidden rounded-xl text-left transition-[transform,opacity,box-shadow] duration-300 ${
                  status === 'completed'
                    ? 'opacity-75 grayscale-[0.2] cursor-default'
                    : status === 'active'
                      ? 'ring-2 ring-cinnabar/40 shadow-lg'
                      : 'shadow-md hover:shadow-xl hover:-translate-y-0.5'
                }`}
                style={{ aspectRatio: '16 / 9' }}
              >
                {/* Base paper texture */}
                <div className="absolute inset-0 bg-[#f5f0e6]" />

                {/* Background painting — scaled to crop white border */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={INTEREST_CARD_BACKGROUNDS[interestTag] || FALLBACK_BG}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src.endsWith(FALLBACK_BG)) return
                      img.src = FALLBACK_BG
                    }}
                    className="h-full w-full object-cover object-right"
                    style={{
                      transform: 'scale(1.06)',
                      opacity: status === 'completed'
                        ? 0.5
                        : interestTag === '历史'
                          ? 0.9
                          : 0.6,
                    }}
                  />
                </div>

                {interestTag === '历史' ? (
                  <>
                    {/* Content mask: left area for text, fades to reveal palace */}
                    <div className="absolute inset-y-0 left-0 w-[64%] bg-gradient-to-r from-[#f5f0e6] via-[#f5f0e6]/95 to-transparent" />

                    {/* Left vertical bookmark */}
                    <div className="absolute left-[2.8%] top-[7%] bottom-[7%] w-[9.5%] bg-[#8B2E2E] rounded-sm flex flex-col items-center justify-center shadow-sm">
                      {art.stampSub.split('').map((char, i) => (
                        <span key={i} className="font-display text-[13px] text-[#f4ead8] leading-tight py-[1px]">
                          {char}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Content mask */}
                    <div className="absolute inset-y-0 left-0 w-[80%] bg-gradient-to-r from-[#f5f0e6] via-[#f5f0e6]/60 via-[40%] to-transparent" />

                    {/* Left vertical bookmark */}
                    <div className="absolute left-[2.8%] top-[7%] bottom-[7%] w-[9.5%] bg-[#8B2E2E] rounded-sm flex flex-col items-center justify-center shadow-sm">
                      {art.stampSub.split('').map((char, i) => (
                        <span key={i} className="font-display text-[12px] text-[#f4ead8] leading-tight py-[1px]">
                          {char}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Main text content */}
                <div className="absolute inset-y-0 left-[16%] right-[22%] flex flex-col justify-center py-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="text-[10px] font-medium tracking-[0.12em]" style={{ color: art.accent }}>
                        {art.eyebrow}
                      </p>
                      {status === 'active' && (
                        <span className="shrink-0 rounded-full bg-cinnabar/90 px-2 py-0.5 text-[9px] font-medium text-paper">
                          探索中
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="shrink-0 rounded-full bg-cinnabar/70 px-2 py-0.5 text-[9px] font-medium text-paper">
                          已盖章
                        </span>
                      )}
                    </div>

                    <h3
                      className="font-display text-[20px] leading-tight tracking-[0.02em]"
                      style={{
                        color: status === 'completed' ? '#8a7a6a' : '#1a0f05',
                        textShadow: '0 1px 2px rgba(245,240,230,0.9)',
                      }}
                    >
                      {spot.name}
                    </h3>

                    <p
                      className="mt-1.5 text-[12px] leading-[1.55]"
                      style={{
                        color: status === 'completed' ? '#9a8a7a' : '#3d2e20',
                        textShadow: '0 1px 2px rgba(245,240,230,0.9)',
                      }}
                    >
                      {art.secret}
                    </p>
                  </div>

                  <div className="mt-2.5">
                    <p className="text-[9px] tracking-[0.1em]" style={{ color: '#7a6a5a' }}>
                      {art.archivalNote}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border bg-[#fff8e8]/70 px-2 py-0.5 text-[9px] font-medium backdrop-blur-sm"
                        style={{ borderColor: `${art.accent}44`, color: art.accent }}
                      >
                        {art.detail}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e8]/70 px-2 py-0.5 text-[9px] text-[#8a7a6a] backdrop-blur-sm">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            crowd === 'smooth' ? 'bg-emerald-500' : crowd === 'moderate' ? 'bg-amber-500' : 'bg-cinnabar'
                          }`}
                        />
                        {crowd === 'smooth' ? '人流平稳' : crowd === 'moderate' ? '人流中等' : '较拥挤'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seal stamp — bottom right */}
                <div
                  className="absolute right-[8%] bottom-[9%] h-[23%] aspect-square flex flex-col items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: status === 'completed' ? 'rgba(163,38,38,0.45)' : '#A32626',
                    color: status === 'completed' ? 'rgba(163,38,38,0.65)' : '#A32626',
                  }}
                >
                  <span className="absolute inset-1 rounded-full border border-current opacity-40" />
                  <span className="font-display text-[16px] leading-none">
                    {status === 'completed' ? '勘' : art.stamp}
                  </span>
                  <span className="mt-0.5 text-[7px] font-medium tracking-[0.14em]">
                    {status === 'completed' ? '已勘' : art.stampSub}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Random explore */}
        {remaining.length > 0 && (
          <Button variant="gold-outline" fullWidth onClick={handleRandom}>
            随机探索
          </Button>
        )}

        {remaining.length === 0 && (
          <Button variant="primary" fullWidth onClick={() => navigate('/complete')}>
            查看结案卷宗
          </Button>
        )}
      </div>
    </div>
  </div>
  )
}
