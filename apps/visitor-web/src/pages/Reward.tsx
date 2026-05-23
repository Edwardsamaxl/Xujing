import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVisitorId } from '../utils/storage'
import { SPOTS } from '../data/spots'

interface RewardData {
  name: string
  unlockText: string
  imageUrl?: string
  taskIndex: number
  totalTasks: number
  spotId?: string
}

export default function Reward() {
  const navigate = useNavigate()
  const [reward, setReward] = useState<RewardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    fetch(`/api/reward?visitorId=${visitorId}`)
      .then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then(data => {
        setReward(data)
        setLoading(false)
        setTimeout(() => setEntered(true), 50)
      })
      .catch(() => {
        const completed = JSON.parse(localStorage.getItem('xujing_completed_spots') || '[]')
        setReward({
          name: '钟表馆密档',
          unlockText: '你发现了奉先殿钟表馆的隐藏线索，中外钟表精品背后的帝国对话徐徐展开。',
          taskIndex: Math.min(completed.length, 2),
          totalTasks: 3,
          spotId: 'spot-clock',
        })
        setLoading(false)
        setTimeout(() => setEntered(true), 50)
      })
  }, [navigate])

  const handleContinue = () => {
    if (reward && reward.taskIndex >= reward.totalTasks - 1) {
      navigate('/complete')
    } else {
      navigate('/narrative')
    }
  }

  const currentTask = (reward?.taskIndex ?? 0) + 1
  const totalTasks = reward?.totalTasks ?? 3
  const spot = reward?.spotId ? SPOTS[reward.spotId] : undefined

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-ink-dim">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-12">
      <div className={`w-full max-w-[400px] transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Success seal */}
        <div className="animate-seal-stamp w-20 h-20 rounded-full border-2 border-cinnabar/60 bg-cinnabar-light flex items-center justify-center mx-auto mb-6">
          <span className="text-cinnabar font-display text-xl tracking-[0.1em]">勘毕</span>
        </div>

        <h2 className="font-display text-[24px] text-ink text-center mb-2">
          勘验成功
        </h2>

        <p className="text-[14px] text-ink-dim text-center mb-8">
          {reward?.unlockText || '你发现了一处隐藏线索'}
        </p>

        {/* Unlocked Card */}
        <div className="card-elevated rounded-xl overflow-hidden card-gold-accent">
          {/* Scroll header decoration */}
          <div className="relative h-[60px] border-b border-gold/20 overflow-hidden">
            <img src="/assets/digital-archive/reward-scroll-header.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-paper-deep/80 to-paper" />
          </div>

          <div className="p-5">
            <h3 className="font-display text-[18px] text-ink text-center">
              {reward?.name || '未知密档'}
            </h3>
            <p className="text-gold/70 text-[12px] tracking-[0.04em] text-center mt-1">
              密档卡片 · 第 {currentTask} 张 / 共 {totalTasks} 张
            </p>

            {spot?.funFacts?.[0] && (
              <div className="bg-gold-dim border border-gold/10 rounded-lg p-3 mt-4">
                <p className="text-gold/60 text-[11px] mb-1">趣闻</p>
                <p className="text-[13px] text-ink-dim leading-[1.6]">
                  {spot.funFacts[0]}
                </p>
              </div>
            )}

            {/* Stamp */}
            <div className="w-16 h-16 rounded-full border-2 border-cinnabar/40 flex items-center justify-center rotate-[-12deg] mx-auto mt-4 relative overflow-hidden">
              <img src="/assets/digital-archive/wax-seal-cracked.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
              <span className="text-cinnabar/70 font-display text-[10px] relative z-10">已勘</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="mt-8 h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-[0_4px_20px_rgba(163,38,38,0.25)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {currentTask >= totalTasks ? '查看纪念册' : '继续探索'}
        </button>
      </div>
    </div>
  )
}
