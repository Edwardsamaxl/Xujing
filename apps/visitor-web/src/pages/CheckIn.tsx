import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getVisitorId } from '../utils/storage'

const SPOT_NAMES: Record<string, string> = {
  'spot-clock': '钟表馆',
  'spot-treasure': '珍宝馆',
  'spot-ceramic': '武英殿·陶瓷馆',
  'spot-yanxi': '延禧宫',
  'spot-shoukang': '寿康宫',
  'spot-cining': '慈宁宫',
}

export default function CheckIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('spotId')
  const [checking, setChecking] = useState(false)
  const [entered, setEntered] = useState(false)

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

    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, spotId }),
      })
      const data = await res.json()

      if (data.rewardUnlocked) {
        navigate('/reward')
      } else if (data.completed) {
        navigate('/complete')
      } else {
        navigate('/narrative')
      }
    } catch {
      setChecking(false)
    }
  }

  const spotName = spotId ? (SPOT_NAMES[spotId] || '目标展厅') : '目标展厅'

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        title="确认到达"
        showBack
        onBack={() => navigate('/narrative')}
      />

      <div
        className={`flex flex-1 flex-col items-center justify-center px-5 transition-all duration-400 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* Location Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-paper-deep">
          <svg
            className="h-9 w-9 text-ink-light"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
            />
          </svg>
        </div>

        <h2 className="mb-3 text-center font-display text-2xl leading-[1.35] tracking-[0.03em] text-ink">
          你已到达{spotName}
        </h2>
        <p className="mb-10 text-center text-base leading-[1.65] text-ink-light">
          请确认你已在馆内，<br />点击打卡解锁下一段剧情
        </p>

        <div className="w-full max-w-[480px] space-y-3">
          <button
            onClick={handleCheckIn}
            disabled={checking}
            className="h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-50"
          >
            {checking ? '确认中...' : '确认打卡'}
          </button>

          <button
            onClick={() => navigate('/narrative')}
            disabled={checking}
            className="h-12 w-full rounded-full border border-cinnabar bg-transparent text-base font-medium text-cinnabar transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            我还没到
          </button>
        </div>
      </div>
    </div>
  )
}
