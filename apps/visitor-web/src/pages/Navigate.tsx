import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { SPOT_SHORT_NAMES, getCrowdLevel } from '../data/spots'
import { planRoute, getModeLabel, getModeDesc, getRouteSpots } from '../utils/route-planner'
import { getCompletedSpots, setRouteMode, type RouteMode } from '../utils/storage'

const MODES: RouteMode[] = ['archaeology', 'full', 'express']

export default function Navigate() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [plan, setPlan] = useState(planRoute)
  const [showModePicker, setShowModePicker] = useState(false)

  const refresh = useCallback(() => {
    setPlan(planRoute())
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const crowdLevel = plan.nextSpotId ? getCrowdLevel(plan.nextSpotId) : 'smooth'
  const crowdColor =
    crowdLevel === 'smooth' ? 'bg-emerald-500' : crowdLevel === 'moderate' ? 'bg-amber-500' : 'bg-cinnabar'
  const crowdText =
    crowdLevel === 'smooth'
      ? '当前区域人流平稳，建议立即前往'
      : crowdLevel === 'moderate'
        ? '当前区域人流中等，可正常前往'
        : '当前区域较为拥挤，建议稍后再去或选择替代路线'

  const routeSpots = getRouteSpots(plan.mode)
  const completedSet = new Set(getCompletedSpots())

  const handleSwitchMode = (mode: RouteMode) => {
    setRouteMode(mode)
    refresh()
    setShowModePicker(false)
  }

  const handleArrived = () => {
    if (plan.nextSpotId) {
      navigate(`/check-in?spotId=${plan.nextSpotId}`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div
        className={`w-full max-w-[400px] transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {/* Title */}
        <div className="mb-8">
          <p className="text-center text-[11px] text-gold tracking-[0.1em] font-serif uppercase mb-2">
            {getModeLabel(plan.mode)}
          </p>
          <h1 className="text-center font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink mb-2">
            路径引导
          </h1>
          <p className="text-center text-[13px] text-ink-dim leading-[1.6]">
            {plan.remainingSpotIds.length === 0
              ? '所有点位已探索完毕'
              : `剩余 ${plan.remainingSpotIds.length} 个点位 · 约 ${plan.totalRemainingTime} 分钟`}
          </p>
        </div>

        {plan.remainingSpotIds.length > 0 ? (
          <>
            {/* Route card */}
            <div className="card-elevated rounded-xl p-6 mb-6">
              {/* Status bar */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2 h-2 rounded-full bg-cinnabar animate-pulse" />
                <span className="text-[13px] text-cinnabar font-medium">实时调度中</span>
                <span className="ml-auto text-[11px] text-ink-faint">
                  {plan.completedCount}/{plan.totalCount} 已完成
                </span>
              </div>

              {/* Route info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-ink-faint tracking-[0.06em] mb-1">
                    {plan.currentSpotId ? '当前地点' : '出发点'}
                  </p>
                  <p className="font-display text-[16px] text-ink">
                    {plan.currentSpotId ? SPOT_SHORT_NAMES[plan.currentSpotId] ?? '入口' : '入口'}
                  </p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8923A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="text-[10px] text-gold mt-0.5">
                    {plan.nextEdge ? `${plan.nextEdge.distance}m` : '---'}
                  </span>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-ink-faint tracking-[0.06em] mb-1">下一地点</p>
                  <p className="font-display text-[16px] text-ink">
                    {plan.nextSpotId ? SPOT_SHORT_NAMES[plan.nextSpotId] ?? '---' : '---'}
                  </p>
                </div>
              </div>

              {/* Time & congestion */}
              <div className="rounded-lg bg-paper-deep border border-scroll-line p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-ink-dim">步行时间</span>
                  <span className="text-[13px] text-ink font-medium">
                    {plan.nextEdge ? `约 ${plan.nextEdge.walkTime} 分钟` : '---'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${crowdColor}`} />
                  <span className="text-[12px] text-ink-dim">{crowdText}</span>
                </div>
              </div>
            </div>

            {/* Path visualization */}
            <div className="flex justify-center mb-8">
              <div className="relative flex flex-col items-center">
                {routeSpots.map((spotId, i) => {
                  const isCompleted = completedSet.has(spotId)
                  const isCurrent = spotId === plan.currentSpotId
                  const isNext = spotId === plan.nextSpotId
                  const isLast = i === routeSpots.length - 1

                  let dotClass = 'w-3 h-3 rounded-full '
                  let lineClass = 'w-px '
                  if (isCompleted) {
                    dotClass += 'bg-gold'
                    lineClass += 'bg-gold/40 h-8'
                  } else if (isCurrent) {
                    dotClass += 'bg-cinnabar animate-pulse'
                    lineClass += 'bg-cinnabar/30 h-8'
                  } else if (isNext) {
                    dotClass += 'bg-cinnabar/60'
                    lineClass += 'bg-scroll-line h-8'
                  } else {
                    dotClass += 'bg-scroll-line'
                    lineClass += 'bg-scroll-line h-8'
                  }

                  return (
                    <div key={spotId} className="flex flex-col items-center">
                      <div className="flex items-center gap-2">
                        <div className={dotClass} />
                        <span
                          className={`text-[11px] whitespace-nowrap ${
                            isCompleted || isCurrent ? 'text-ink' : 'text-ink-faint'
                          }`}
                        >
                          {SPOT_SHORT_NAMES[spotId]}
                        </span>
                      </div>
                      {!isLast && <div className={lineClass} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="space-y-3">
              <button
                onClick={handleArrived}
                className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98] hover:shadow-[0_4px_16px_rgba(163,38,38,0.15)]"
              >
                我已到达
              </button>
              <button
                onClick={() => setShowModePicker(true)}
                className="h-12 w-full rounded-full border border-cinnabar text-cinnabar bg-transparent text-[15px] font-medium tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98]"
              >
                切换路线
              </button>
            </div>
          </>
        ) : (
          /* All completed */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8923A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="font-display text-[18px] text-ink mb-2">路线已完成</p>
            <p className="text-[13px] text-ink-dim mb-8">你已探索完全部点位</p>
            <button
              onClick={() => navigate('/complete')}
              className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98]"
            >
              查看成就
            </button>
          </div>
        )}
      </div>

      {/* Mode picker modal */}
      {showModePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowModePicker(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[400px] bg-paper rounded-t-2xl p-6 pb-10 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-1 rounded-full bg-scroll-line mx-auto mb-6" />
            <h3 className="font-display text-[18px] text-ink text-center mb-6">选择路线</h3>
            <div className="space-y-3">
              {MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSwitchMode(mode)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    plan.mode === mode
                      ? 'border-cinnabar bg-cinnabar/5'
                      : 'border-scroll-line hover:border-gold/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-[15px] text-ink">{getModeLabel(mode)}</span>
                    {plan.mode === mode && (
                      <span className="text-[11px] text-cinnabar font-medium">当前</span>
                    )}
                  </div>
                  <p className="text-[12px] text-ink-dim">{getModeDesc(mode)}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModePicker(false)}
              className="mt-4 h-12 w-full rounded-full border border-scroll-line text-[15px] text-ink-dim transition-all active:scale-[0.98]"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
