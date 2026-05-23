import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScrollCard from '../components/ScrollCard'
import { getVisitorId } from '../utils/storage'

interface RewardData {
  name: string
  unlockText: string
  imageUrl?: string
  taskIndex: number
  totalTasks: number
}

export default function Reward() {
  const navigate = useNavigate()
  const [reward, setReward] = useState<RewardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    fetch(`/api/reward?visitorId=${visitorId}`)
      .then(r => r.json())
      .then(data => {
        setReward(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [navigate])

  const handleContinue = () => {
    if (reward && reward.taskIndex >= reward.totalTasks - 1) {
      navigate('/complete')
    } else {
      navigate('/narrative')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-ink-light">加载中...</p>
      </div>
    )
  }

  const currentTask = (reward?.taskIndex ?? 0) + 1
  const totalTasks = reward?.totalTasks ?? 3

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-[480px]">
        {/* Success Icon */}
        <div className="animate-icon-pop mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-bamboo-light">
          <svg
            className="h-9 w-9 text-bamboo"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="animate-text-fade mb-2 text-center font-display text-2xl leading-[1.35] tracking-[0.03em] text-ink"
        >
          打卡成功
        </h2>

        <p className="animate-text-fade mb-8 text-center text-base leading-[1.65] text-ink-light"
        >
          {reward?.unlockText || '你找到了隐藏线索'}
        </p>

        {/* Unlocked Card */}
        <div className="animate-card-slide-up">
          <ScrollCard unlocked>
            {/* Illustration placeholder */}
            <div className="mb-4 aspect-video w-full overflow-hidden rounded-md outline outline-1 outline-ink/10 outline-offset-[-1px] bg-paper">
              {reward?.imageUrl ? (
                <img
                  src={reward.imageUrl}
                  alt={reward.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg
                    className="h-12 w-12 text-ink-faint"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 18.75h18M4.5 12.75h.008v.008H4.5v-.008z"
                    />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="mb-1 text-center text-lg font-semibold text-ink">
              {reward?.name || '未知奖励'}
            </h3>
            <p className="text-center text-[13px] text-gold">
              专属解锁 · {currentTask}/{totalTasks}
            </p>
          </ScrollCard>
        </div>

        <button
          onClick={handleContinue}
          className="mt-8 h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          继续探索
        </button>
      </div>
    </div>
  )
}
