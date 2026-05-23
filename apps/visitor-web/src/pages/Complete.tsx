import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toPng } from 'html-to-image'
import TopNav from '../components/TopNav'
import {
  getVisitorId,
  clearVisitor,
  getCompletedSpots,
  getUnlockedNarratives,
  isNarrativeUnlocked,
  getCheckInTimes,
} from '../utils/storage'
import { getTotalRouteStats } from '../utils/route-planner'
import { Button } from '../components/Button'

// ---------- Types ----------

interface GridItem {
  id: string
  label: string
  medalPath: string
}

// ---------- Constants ----------

const GRID_ITEMS: GridItem[] = [
  { id: 'spot-clock', label: '钟表馆', medalPath: '/assets/medal/钟表馆.png' },
  { id: 'spot-treasure', label: '珍宝馆', medalPath: '/assets/medal/珍宝馆.png' },
  { id: 'spot-ceramic', label: '陶瓷馆', medalPath: '/assets/medal/陶瓷馆.png' },
  { id: 'spot-yanxi', label: '延禧宫', medalPath: '/assets/medal/延禧宫.png' },
  { id: 'spot-shoukang', label: '寿康宫', medalPath: '/assets/medal/寿康宫.png' },
  { id: 'spot-cining', label: '慈宁宫', medalPath: '/assets/medal/慈宁宫.png' },
]

const STAT_CARDS = [
  { label: '勘验宫殿', unit: '座', key: 'spots' as const },
  { label: '收集密档', unit: '张', key: 'rewards' as const },
  { label: '步行里程', unit: '米', key: 'distance' as const },
  { label: '总耗时', unit: '分', key: 'time' as const },
]

// ---------- Hooks ----------

function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target <= 0) {
      setValue(0)
      return
    }
    const timer = setTimeout(() => {
      const startTime = Date.now()
      const tick = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 4)
        setValue(Math.round(target * eased))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, duration, delay])
  return value
}

// ---------- Main Page ----------

export default function Complete() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revealedItems, setRevealedItems] = useState<Set<string>>(new Set())
  const posterRef = useRef<HTMLDivElement>(null)

  const completedSpots = getCompletedSpots()
  const unlockedNarratives = getUnlockedNarratives()
  const spotCount = completedSpots.length
  const rewardCount = unlockedNarratives.length

  // 真实步行距离：用 ENTRY_EDGES + SPOT_GRAPH 累加，按用户实际访问顺序
  const { distance: realDistance, walkTime: realWalkTime } =
    getTotalRouteStats(completedSpots)

  // 真实总耗时：取首次 → 末次打卡时间戳的真实间隔（分钟）。如果不足两次或缺少时间戳，
  // 退回纯走路时间 + 每个点位 20 分钟参观估算。
  const checkInTimes = getCheckInTimes()
  const timestamps = completedSpots
    .map((id) => checkInTimes[id])
    .filter((t): t is number => typeof t === 'number')
  const realTotalMin =
    timestamps.length >= 2
      ? Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000))
      : realWalkTime + spotCount * 20

  const distance = realDistance
  const time = realTotalMin

  const spotCountAnim = useCountUp(spotCount, 800, 300)
  const rewardCountAnim = useCountUp(rewardCount, 800, 400)
  const distanceAnim = useCountUp(distance, 800, 500)
  const timeAnim = useCountUp(time, 800, 600)

  const statValues = {
    spots: spotCountAnim,
    rewards: rewardCountAnim,
    distance: distanceAnim,
    time: timeAnim,
  }

  // Auth check + page enter
  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [navigate])

  // Staggered medal reveal
  useEffect(() => {
    if (!entered) return
    const unlocked = GRID_ITEMS.filter((item) => isNarrativeUnlocked(item.id))
    const timers: ReturnType<typeof setTimeout>[] = []
    unlocked.forEach((item, index) => {
      const t = setTimeout(() => {
        setRevealedItems((prev) => new Set([...prev, item.id]))
      }, 500 + index * 120)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [entered])

  const handleRestart = useCallback(() => {
    clearVisitor()
    navigate('/')
  }, [navigate])

  const handleSavePoster = useCallback(async () => {
    if (!posterRef.current) return
    setSaving(true)
    try {
      const dataUrl = await toPng(posterRef.current, {
        pixelRatio: 2,
        backgroundColor: '#F7F4ED',
      })
      const link = document.createElement('a')
      link.download = `故宫勘验纪念-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('海报生成失败:', err)
      alert('海报生成失败，请重试')
    } finally {
      setSaving(false)
    }
  }, [])

  const posterSpotCount = GRID_ITEMS.filter((item) =>
    isNarrativeUnlocked(item.id)
  ).length

  return (
    <div className="min-h-screen bg-paper pb-8">
      <TopNav title="勘验完成" showBack onBack={() => navigate(-1)} />
      <div
        className={`mx-auto w-full max-w-[480px] px-5 pt-6 transition-[opacity,transform] duration-500 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* ===== Title ===== */}
        <h1 className="font-display text-[28px] text-ink text-center tracking-[0.04em] leading-[1.3] mb-2">
          密档寻踪·已完成
        </h1>
        <p className="text-center text-[16px] leading-[1.65] text-ink-dim mb-8">
          你穿越了 {spotCountAnim} 座宫殿，找到了 {rewardCountAnim} 条隐藏线索
        </p>

        {/* ===== Stats ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-cinnabar rounded-full" />
            <span className="text-[12px] text-ink-dim tracking-[0.04em]">
              勘验数据
            </span>
          </div>
          <div
            className="rounded-lg px-2 py-4"
            style={{
              background: '#EFEBE1',
              borderTop: '1px solid #D4CFC3',
              borderBottom: '1px solid #D4CFC3',
            }}
          >
            <div className="grid grid-cols-4">
              {STAT_CARDS.map((stat, i) => (
                <div
                  key={stat.key}
                  className="px-2 text-center"
                  style={{
                    borderRight:
                      i < STAT_CARDS.length - 1
                        ? '1px solid rgba(43,41,38,0.08)'
                        : 'none',
                  }}
                >
                  <div className="text-ink font-display text-[20px] font-bold leading-none">
                    {statValues[stat.key]}
                  </div>
                  <div className="text-ink-faint text-[11px] mt-2 leading-none tracking-wide">
                    {stat.label}
                  </div>
                  <div className="text-ink-faint text-[10px] leading-none mt-1">
                    {stat.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Medal Gallery ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-cinnabar rounded-full" />
            <span className="text-[12px] text-ink-dim tracking-[0.04em]">
              勋章藏宝阁
            </span>
          </div>

          <div
            className="rounded-lg p-5"
            style={{
              background: '#EFEBE1',
              borderTop: '1px solid #D4CFC3',
              borderBottom: '1px solid #D4CFC3',
            }}
          >
            <div className="grid grid-cols-3 gap-3">
              {GRID_ITEMS.map((item) => {
                const unlocked = isNarrativeUnlocked(item.id)
                const revealed = revealedItems.has(item.id)

                return (
                  <div key={item.id} className="flex flex-col items-center">
                    <div
                      className={`relative w-full aspect-square flex items-center justify-center transition-[opacity,transform] duration-500 ${
                        unlocked && revealed ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      {unlocked ? (
                        <img
                          src={item.medalPath}
                          alt={`${item.label}勋章`}
                          className={`w-full h-full object-contain transition-transform duration-500 ${
                            revealed ? 'scale-100' : 'scale-90'
                          }`}
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="w-[78%] h-[78%] rounded-full flex items-center justify-center"
                          style={{
                            border: '1px dashed rgba(43,41,38,0.18)',
                          }}
                        >
                          <span className="text-ink-faint/40 text-2xl font-display select-none">
                            ?
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 transition-opacity duration-300 ${
                        unlocked && revealed
                          ? 'opacity-100 text-ink'
                          : 'opacity-40 text-ink-faint'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ===== Route Review ===== */}
        <div
          className="rounded-lg p-5 mb-6"
          style={{
            background: '#EFEBE1',
            borderTop: '1px solid #D4CFC3',
            borderBottom: '1px solid #D4CFC3',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-cinnabar rounded-full" />
            <span className="text-[12px] text-ink-dim tracking-[0.04em]">
              路线回顾
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-[12px] text-ink-dim">
            {GRID_ITEMS.map((item, i) => {
              const done = isNarrativeUnlocked(item.id)
              return (
                <span key={item.id} className="flex items-center">
                  <span className={done ? 'text-ink font-medium' : ''}>{item.label}</span>
                  {i < GRID_ITEMS.length - 1 && (
                    <svg
                      className="mx-1 h-3 w-3 text-ink-faint/30"
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
              )
            })}
          </div>
        </div>

        {/* ===== Action Buttons ===== */}
        <div className="space-y-3">
          <Button variant="primary" fullWidth onClick={() => setShowShare(true)}>
            生成纪念卡
          </Button>
          <Button variant="secondary" fullWidth onClick={handleRestart}>
            再探一次
          </Button>
        </div>
      </div>

      {/* ===== Share Poster Modal ===== */}
      {showShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[340px]">
            {/* Poster */}
            <div
              ref={posterRef}
              className="w-[320px] mx-auto rounded-lg p-6 relative overflow-hidden"
              style={{ background: '#F7F4ED' }}
            >
              {/* Paper grain */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '128px',
                }}
              />

              {/* Header */}
              <div className="relative z-10 text-center mb-4">
                <p className="text-gold text-[10px] tracking-[0.25em] font-serif">
                  故宫私人馆藏展
                </p>
                <h2 className="text-ink font-display text-xl mt-1 tracking-wider">
                  勘验纪念卡
                </h2>
                <div className="mt-2 mx-auto w-8 h-px bg-scroll-line" />
              </div>

              {/* Medal grid */}
              <div className="relative z-10 grid grid-cols-3 gap-2 mb-4">
                {GRID_ITEMS.map((item) => {
                  const unlocked = isNarrativeUnlocked(item.id)
                  return (
                    <div
                      key={item.id}
                      className="aspect-square flex items-center justify-center"
                    >
                      {unlocked ? (
                        <img
                          src={item.medalPath}
                          alt={item.label}
                          className="w-full h-full object-contain"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="w-[78%] h-[78%] rounded-full flex items-center justify-center"
                          style={{
                            border: '1px dashed rgba(43,41,38,0.16)',
                          }}
                        >
                          <span className="text-ink-faint/30 text-sm font-display select-none">
                            ?
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Stats */}
              <div className="relative z-10 flex justify-center gap-6 mb-4">
                <div className="text-center">
                  <div className="text-ink font-display text-2xl font-bold">
                    {posterSpotCount}
                  </div>
                  <div className="text-ink-faint text-[10px] mt-0.5">宫殿</div>
                </div>
                <div className="w-px bg-scroll-line" />
                <div className="text-center">
                  <div className="text-ink font-display text-2xl font-bold">
                    {rewardCount}
                  </div>
                  <div className="text-ink-faint text-[10px] mt-0.5">密档</div>
                </div>
              </div>

              {/* Caption */}
              <p className="relative z-10 text-ink-dim text-[12px] text-center leading-relaxed px-2">
                我在故宫完成了 {posterSpotCount} 处历史碎片的溯源修复，
                <br />
                这是我留给紫禁城的数字印记。
              </p>

              {/* Footer */}
              <div className="relative z-10 mt-4 flex items-center gap-2">
                <div className="flex-1 h-px bg-scroll-line" />
                <span className="text-ink-faint text-[9px] font-serif tracking-wider">
                  叙境 Xujing
                </span>
                <div className="flex-1 h-px bg-scroll-line" />
              </div>
            </div>

            {/* Modal buttons */}
            <div className="mt-4 space-y-2.5">
              <Button
                variant="primary"
                fullWidth
                onClick={handleSavePoster}
                disabled={saving}
              >
                {saving ? '生成中...' : '保存到相册'}
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setShowShare(false)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
