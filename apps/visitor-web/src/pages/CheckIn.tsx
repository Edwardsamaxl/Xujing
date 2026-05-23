import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getVisitorId, addCompletedSpot } from '../utils/storage'
import { SPOTS } from '../data/spots'

export default function CheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('spotId')
  const [checking, setChecking] = useState(false)
  const [entered, setEntered] = useState(false)
  const [stamped, setStamped] = useState(false)

  useEffect(() => {
    if (!spotId) {
      navigate('/narrative')
      return
    }
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [spotId, navigate])

  const handleCheckIn = async () => {
    const visitorId = getVisitorId()
    if (!visitorId || !spotId) return
    setChecking(true)
    setStamped(true)

    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, spotId }),
      })
      const data = await res.json()
      addCompletedSpot(spotId)
      setTimeout(() => {
        if (data.rewardUnlocked) {
          navigate('/reward')
        } else if (data.completed) {
          navigate('/complete')
        } else {
          navigate('/narrative')
        }
      }, 800)
    } catch {
      setTimeout(() => navigate('/reward'), 800)
    }
  }

  const spot = spotId ? SPOTS[spotId] : undefined
  const spotName = spot?.name || '目标展厅'

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav title="到达确认" showBack onBack={() => navigate('/narrative')} />

      <div className={`flex flex-1 flex-col items-center justify-center px-6 transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Location card */}
        <div className="w-full max-w-[360px] card-elevated rounded-xl overflow-hidden mb-8">
          {/* Decorative header */}
          <div className="bg-gradient-to-b from-paper-deep to-paper h-[80px] border-b border-gold/20 relative">
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <p className="text-gold/70 text-[11px] tracking-[0.1em] font-serif uppercase">目标地点</p>
            </div>
          </div>

          <div className="p-5 pt-3">
            <h2 className="font-display text-[22px] text-ink text-center mt-3">
              {spotName}
            </h2>
            {spot?.description && (
              <p className="text-[13px] text-ink-dim text-center mt-2 leading-[1.6]">
                {spot.description}
              </p>
            )}
          </div>
        </div>

        <p className="mb-8 text-center text-[14px] leading-[1.6] text-ink-dim">
          请确认你已到达该地点，点击下方按钮完成打卡
        </p>

        {/* Seal stamp button */}
        <div className="relative">
          {stamped && (
            <div className="absolute inset-0 flex items-center justify-center z-10 animate-seal-stamp pointer-events-none">
              <div className="w-28 h-28 rounded-full border-4 border-cinnabar/80 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
                <span className="text-cinnabar font-display text-2xl tracking-[0.1em]">勘毕</span>
              </div>
            </div>
          )}
          <button
            onClick={handleCheckIn}
            disabled={checking || stamped}
            className={`h-14 px-12 rounded-full text-[16px] font-medium tracking-[0.06em] transition-all duration-200 ease-out active:scale-[0.96] disabled:opacity-50 ${
              stamped
                ? 'bg-transparent border-2 border-cinnabar text-cinnabar'
                : 'bg-cinnabar text-white hover:shadow-[0_4px_20px_rgba(163,38,38,0.15)]'
            }`}
          >
            {checking ? '勘验中...' : '勘验打卡'}
          </button>
        </div>

        <button
          onClick={() => navigate('/narrative')}
          disabled={checking || stamped}
          className="mt-4 text-[13px] text-ink-faint hover:text-ink-dim transition-colors"
        >
          我还没到
        </button>
      </div>
    </div>
  )
}
