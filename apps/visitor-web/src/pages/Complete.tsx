import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { toPng } from 'html-to-image'
import TopNav from '../components/TopNav'
import {
  getVisitorId,
  clearVisitor,
  getCompletedSpots,
  getUnlockedNarratives,
  isNarrativeUnlocked,
  getCheckInTimes,
  getInterestTag,
} from '../utils/storage'
import { getTotalRouteStats } from '../utils/route-planner'
import { SPOTS } from '../data/spots'
import { Button } from '../components/Button'

// ---------- Types ----------

interface GridItem {
  id: string
  label: string
  medalPath: string
}

interface InterestProfile {
  title: string
  subtitle: string
  seal: string
  sealSub: string
  accent: string
  posterCaption: string
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

const INTEREST_PROFILES: Record<string, InterestProfile> = {
  历史: {
    title: '史官勘验完成',
    subtitle: '六百年宫廷史，已尽收卷中',
    seal: '史',
    sealSub: '已勘',
    accent: '#8C5A20',
    posterCaption: '以史为眼，重读紫禁城的权力与兴衰',
  },
  建筑: {
    title: '营造勘验完成',
    subtitle: '榫卯斗拱之间，藏着凝固的音乐',
    seal: '建',
    sealSub: '已勘',
    accent: '#9F6D16',
    posterCaption: '以营造为尺，丈量皇家建筑的几何密码',
  },
  人物: {
    title: '人物勘验完成',
    subtitle: '帝王将相恩怨，已录入档案',
    seal: '人',
    sealSub: '已勘',
    accent: '#54677D',
    posterCaption: '以人为镜，照见紫禁城深处的温度与血腥',
  },
  亲子: {
    title: '宫廷探秘完成',
    subtitle: '寓教于乐，故宫是最好的立体教科书',
    seal: '探',
    sealSub: '已勘',
    accent: '#66714B',
    posterCaption: '以趣为引，在故宫发现最好玩的知识宝藏',
  },
  悬疑: {
    title: '密档勘验完成',
    subtitle: '未解之谜已揭开，真相远比传说离奇',
    seal: '疑',
    sealSub: '已勘',
    accent: '#934C36',
    posterCaption: '以疑为钥，打开紫禁城隐秘的档案柜',
  },
  工艺: {
    title: '工艺勘验完成',
    subtitle: '巧夺天工之术，已逐一核验',
    seal: '工',
    sealSub: '已勘',
    accent: '#476F72',
    posterCaption: '以工为道，见证皇家技艺与时间的对决',
  },
}

// ---------- Main Page ----------

export default function Complete() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revealedItems, setRevealedItems] = useState<Set<string>>(new Set())
  const [showReward, setShowReward] = useState(false)
  const [rewardFading, setRewardFading] = useState(false)
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const posterRef = useRef<HTMLDivElement>(null)

  const interestTag = getInterestTag()
  const profile = INTEREST_PROFILES[interestTag] ?? INTEREST_PROFILES['历史']

  const completedSpots = getCompletedSpots()
  const unlockedNarratives = getUnlockedNarratives()
  const spotCount = completedSpots.length
  const rewardCount = unlockedNarratives.length

  const { distance: realDistance, walkTime: realWalkTime } =
    getTotalRouteStats(completedSpots)

  const checkInTimes = getCheckInTimes()
  const timestamps = completedSpots
    .map((id) => checkInTimes[id])
    .filter((t): t is number => typeof t === 'number')
  const realTotalMin =
    timestamps.length >= 2
      ? Math.max(1, Math.round((Math.max(...timestamps) - Math.min(...timestamps)) / 60000))
      : realWalkTime + spotCount * 20

  const statValues = {
    spots: spotCount,
    rewards: rewardCount,
    distance: realDistance,
    time: realTotalMin,
  }

  const posterSpotCount = GRID_ITEMS.filter((item) =>
    isNarrativeUnlocked(item.id)
  ).length

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

  const handleMedalClick = (spotId: string) => {
    if (!isNarrativeUnlocked(spotId)) return
    setSelectedSpotId(spotId)
    setShowReward(true)
  }

  const handleDismissReward = () => {
    setRewardFading(true)
    setTimeout(() => {
      setShowReward(false)
      setRewardFading(false)
      setSelectedSpotId(null)
    }, 700)
  }

  return (
    <div className="min-h-screen bg-paper pb-8">
      <TopNav title="勘验完成" showBack onBack={() => navigate(-1)} />
      <div
        className={`mx-auto w-full max-w-[480px] px-5 pt-6 transition-[opacity,transform] duration-500 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* ===== Archive Header ===== */}
        <div className="relative text-center mb-8">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{
              background: `${profile.accent}12`,
              border: `1px solid ${profile.accent}25`,
            }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: profile.accent }}
            />
            <span
              className="text-[10px] tracking-[0.12em]"
              style={{ color: profile.accent }}
            >
              {interestTag} · 勘验档案
            </span>
          </div>

          <h1 className="font-display text-[26px] text-ink tracking-[0.04em] leading-[1.3] mb-2">
            {profile.title}
          </h1>
          <p className="text-[14px] leading-[1.6] text-ink-dim max-w-[280px] mx-auto">
            {profile.subtitle}
          </p>

          {/* Seal stamp */}
          <div
            className="absolute -right-1 top-0 w-14 h-14 rounded-full border-[1.5px] flex flex-col items-center justify-center rotate-3 opacity-80"
            style={{ borderColor: profile.accent, color: profile.accent }}
          >
            <span className="absolute inset-[3px] rounded-full border border-current opacity-30" />
            <span className="font-display text-[16px] leading-none">
              {profile.seal}
            </span>
            <span className="text-[8px] tracking-[0.1em] mt-0.5">
              {profile.sealSub}
            </span>
          </div>
        </div>

        {/* ===== Stats ===== */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-cinnabar rounded-full" />
            <span className="text-[12px] text-ink-dim tracking-[0.04em]">
              勘验数据
            </span>
          </div>
          <div
            className="relative rounded-lg px-5 py-5"
            style={{
              background: '#EFEBE1',
              border: '1px solid #D4CFC3',
            }}
          >
            {/* Corner ornaments */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-cinnabar/25" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-cinnabar/25" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-cinnabar/25" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-cinnabar/25" />

            <div className="grid grid-cols-4 divide-x divide-scroll-line/60">
              {STAT_CARDS.map((stat) => (
                <div
                  key={stat.key}
                  className="px-2 text-center first:pl-0 last:pr-0"
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
                          className={`w-full h-full object-contain transition-transform duration-500 cursor-pointer ${
                            revealed ? 'scale-100' : 'scale-90'
                          }`}
                          draggable={false}
                          onClick={() => handleMedalClick(item.id)}
                        />
                      ) : (
                        <img
                          src={item.medalPath}
                          alt={`${item.label}勋章`}
                          className="w-full h-full object-contain grayscale opacity-25"
                          draggable={false}
                        />
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

        {/* ===== Route Review (Vertical Timeline) ===== */}
        <div
          className="rounded-lg p-5 mb-6"
          style={{
            background: '#EFEBE1',
            borderTop: '1px solid #D4CFC3',
            borderBottom: '1px solid #D4CFC3',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 bg-cinnabar rounded-full" />
            <span className="text-[12px] text-ink-dim tracking-[0.04em]">
              路线回顾
            </span>
          </div>

          <div className="relative pl-6">
            {/* Vertical connecting line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-scroll-line" />

            {GRID_ITEMS.map((item) => {
              const done = isNarrativeUnlocked(item.id)
              return (
                <div
                  key={item.id}
                  className="relative flex items-center gap-3 py-2.5"
                >
                  {/* Timeline node */}
                  <div
                    className={`absolute left-0 w-[18px] h-[18px] rounded-full flex items-center justify-center z-10 transition-colors duration-300 ${
                      done
                        ? 'bg-cinnabar'
                        : 'bg-paper border border-scroll-line-dark'
                    }`}
                  >
                    {done && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Spot label */}
                  <span
                    className={`text-[13px] ${
                      done
                        ? 'text-ink font-medium'
                        : 'text-ink-faint'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Status badge */}
                  {done && (
                    <span className="ml-auto text-[10px] text-gold tracking-wide">
                      已勘验
                    </span>
                  )}
                </div>
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
              className="w-[320px] mx-auto relative overflow-hidden"
              style={{
                background: '#F7F4ED',
                aspectRatio: '3/4',
              }}
            >
              {/* Interest tint wash */}
              <div
                className="absolute inset-0 opacity-[0.025]"
                style={{ background: profile.accent }}
              />

              {/* Paper grain */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '128px',
                }}
              />

              {/* Top frame line */}
              <div className="absolute top-5 left-6 right-6 h-px bg-scroll-line" />

              {/* Header */}
              <div className="relative z-10 text-center pt-10 pb-5">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="h-px w-8 bg-scroll-line-dark" />
                  <span className="text-gold text-[10px] tracking-[0.25em] font-serif">
                    故宫私人馆藏展
                  </span>
                  <div className="h-px w-8 bg-scroll-line-dark" />
                </div>
                <h2 className="text-ink font-display text-xl tracking-wider">
                  勘验纪念卡
                </h2>

                {/* Interest seal */}
                <div
                  className="absolute right-5 top-8 w-12 h-12 rounded-full border-[1.5px] flex flex-col items-center justify-center rotate-6"
                  style={{ borderColor: profile.accent, color: profile.accent }}
                >
                  <span className="absolute inset-[2px] rounded-full border border-current opacity-30" />
                  <span className="font-display text-[14px] leading-none">
                    {profile.seal}
                  </span>
                  <span className="text-[7px] tracking-wider mt-0.5">
                    {profile.sealSub}
                  </span>
                </div>
              </div>

              {/* Decorative divider */}
              <div className="relative z-10 flex items-center gap-2 px-8 mb-5">
                <div className="flex-1 h-px bg-scroll-line" />
                <span className="text-ink-faint text-[9px] tracking-[0.15em]">
                  {interestTag}档案
                </span>
                <div className="flex-1 h-px bg-scroll-line" />
              </div>

              {/* Medal grid */}
              <div className="relative z-10 px-10">
                <div className="grid grid-cols-3 gap-3">
                  {GRID_ITEMS.map((item) => {
                    const unlocked = isNarrativeUnlocked(item.id)
                    return (
                      <div
                        key={item.id}
                        className="aspect-square flex items-center justify-center"
                      >
                        <img
                          src={item.medalPath}
                          alt={item.label}
                          className={`w-full h-full object-contain ${
                            unlocked ? '' : 'grayscale opacity-30'
                          }`}
                          draggable={false}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="relative z-10 flex justify-center gap-8 mt-6 mb-5">
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

              {/* Personalized caption */}
              <p className="relative z-10 text-ink-dim text-[12px] text-center leading-relaxed px-10">
                {profile.posterCaption}
              </p>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 z-10">
                <div className="flex items-center gap-2 px-8">
                  <div className="flex-1 h-px bg-scroll-line" />
                  <span className="text-ink-faint text-[9px] font-serif tracking-wider">
                    叙境 Xujing
                  </span>
                  <div className="flex-1 h-px bg-scroll-line" />
                </div>
                <p className="text-center text-[8px] text-ink-faint/60 mt-2 tracking-wider">
                  故宫叙境 · 数字文旅勘验
                </p>
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

      {/* Reward popup overlay */}
      {showReward && selectedSpotId &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-700 ${
              rewardFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="card-elevated bg-paper rounded-2xl p-8 max-w-[320px] w-full mx-6 text-center animate-seal-stamp">
              {/* Medal image */}
              <div className="w-52 h-52 mx-auto mb-5">
                <img
                  src={GRID_ITEMS.find((i) => i.id === selectedSpotId)?.medalPath}
                  alt={`${SPOTS[selectedSpotId].shortName}勋章`}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="font-display text-[20px] text-ink mb-1">{SPOTS[selectedSpotId].name} 已勘验</h3>
              <p className="text-[12px] text-ink-dim mb-2">秘辛已解锁，收录于密档</p>
              <div className="mt-4 p-3 rounded-lg bg-gold-dim border border-gold/10 mb-5">
                <p className="text-[12px] text-gold/70">{SPOTS[selectedSpotId].teaser}</p>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={handleDismissReward}
                disabled={rewardFading}
              >
                收好勋章
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
