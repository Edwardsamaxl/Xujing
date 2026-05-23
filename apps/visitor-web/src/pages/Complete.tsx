import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScrollCard from '../components/ScrollCard'
import { getVisitorId, clearVisitor } from '../utils/storage'

interface RouteSummary {
  spots: { name: string; id: string }[]
  rewards: { name: string; imageUrl?: string }[]
}

export default function Complete() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<RouteSummary | null>(null)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    fetch(`/api/summary?visitorId=${visitorId}`)
      .then(r => r.json())
      .then(data => {
        setSummary(data)
        setTimeout(() => setEntered(true), 50)
      })
      .catch(() => {
        // Fallback mock data
        setSummary({
          spots: [
            { name: '钟表馆', id: 'spot-clock' },
            { name: '延禧宫', id: 'spot-yanxi' },
            { name: '寿康宫', id: 'spot-shoukang' },
          ],
          rewards: [
            { name: '延禧宫御制金印' },
            { name: '寿康宫黄花梨印记' },
            { name: '慈宁宫雕塑徽章' },
          ],
        })
        setTimeout(() => setEntered(true), 50)
      })
  }, [navigate])

  const handleRestart = () => {
    clearVisitor()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-12 pb-8"
    >
      <div
        className={`mx-auto w-full max-w-[480px] transition-all duration-400 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* Building illustration */}
        <div className="mb-6 flex justify-center"
        >
          <svg
            className="h-[120px] w-[120px] text-ink-light"
            viewBox="0 0 120 120"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
          >
            <path d="M60 10L20 35h80L60 10z" />
            <path d="M25 35v70M95 35v70M25 105h70" />
            <path d="M35 50h50M35 65h50M35 80h50" />
            <path d="M45 50v-8h8v8M67 50v-8h8v8" />
            <path d="M42 80v25h-7v-25M85 80v25h-7v-25" />
            <circle cx="60" cy="25" r="3" />
            <path d="M55 28h10" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-center font-display text-[28px] leading-[1.3] tracking-[0.04em] text-ink"
        >
          密档寻踪·已完成
        </h1>

        <p className="mb-8 text-center text-base leading-[1.65] text-ink-light"
        >
          你穿越了 {summary?.spots?.length ?? 3} 座宫殿
          <br />
          找到了 {summary?.rewards?.length ?? 3} 条隐藏线索
        </p>

        {/* Memorial scroll card */}
        <ScrollCard>
          {/* Thumbnails horizontal scroll */}
          <div className="mb-4 flex gap-3 overflow-x-auto no-scrollbar pb-2"
          >
            {(summary?.rewards ?? []).map((reward, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[100px]"
              >
                <div className="mb-2 aspect-[3/4] w-full overflow-hidden rounded-md outline outline-1 outline-ink/10 outline-offset-[-1px] bg-paper flex items-center justify-center"
                >
                  {reward.imageUrl ? (
                    <img
                      src={reward.imageUrl}
                      alt={reward.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg
                      className="h-8 w-8 text-ink-faint"
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
                  )}
                </div>
                <p className="text-center text-[12px] leading-[1.4] text-ink-light"
                >
                  {reward.name}
                </p>
              </div>
            ))}
          </div>

          {/* Route review */}
          <div className="border-t border-scroll-line pt-4"
          >
            <p className="mb-2 text-[13px] text-ink-light"
            >
              路线回顾
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink"
            >
              {(summary?.spots ?? []).map((spot, i) => (
                <span key={spot.id} className="flex items-center"
                >
                  <span
                  >
                    {spot.name}
                  </span>
                  {i < (summary?.spots?.length ?? 0) - 1 && (
                    <svg
                      className="mx-1 h-3 w-3 text-ink-faint"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </span>
              ))}
            </div>
          </div>
        </ScrollCard>

        {/* Buttons */}
        <div className="mt-8 space-y-3"
        >
          <button
            onClick={() => alert('纪念卡生成中...')}
            className="h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            生成纪念卡
          </button>

          <button
            onClick={handleRestart}
            className="h-12 w-full rounded-full border border-cinnabar bg-transparent text-base font-medium text-cinnabar transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            再探一次
          </button>
        </div>
      </div>
    </div>
  )
}
