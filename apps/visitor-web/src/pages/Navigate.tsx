import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { SPOTS, getCrowdLevel } from '../data/spots'
import { addCompletedSpot, unlockNarrative, setCurrentTarget, getCompletedSpots } from '../utils/storage'
import { getRouteTo } from '../utils/route-planner'

/* ---------- 故宫简图 —— 基于真实布局（viewBox 0 0 400 320） ---------- */

/* 6 个点位坐标，按故宫真实方位放置 */
const SPOT_POS: Record<string, { x: number; y: number }> = {
  'spot-ceramic':  { x: 70,  y: 215 }, // 武英殿 — 外朝西路（熙和门以西）
  'spot-clock':    { x: 305, y: 125 }, // 钟表馆 — 内廷东路（景运门以东）
  'spot-treasure': { x: 340, y: 50 },  // 珍宝馆 — 外东路东北角（锡庆门入）
  'spot-yanxi':    { x: 315, y: 95 },  // 延禧宫 — 东六宫
  'spot-cining':   { x: 80,  y: 135 }, // 慈宁宫 — 外西路偏南
  'spot-shoukang': { x: 65,  y: 85 },  // 寿康宫 — 外西路偏北
}

/* 关键通道节点 */
const NODES: Record<string, { x: number; y: number }> = {
  entrance:  { x: 200, y: 290 }, // 午门
  taihemen:  { x: 200, y: 230 }, // 太和门
  qianqing:  { x: 200, y: 145 }, // 乾清门
  xihe:      { x: 115, y: 210 }, // 熙和门（外朝西路入口）
  longzong:  { x: 130, y: 145 }, // 隆宗门（外西路入口）
  jingyun:   { x: 270, y: 145 }, // 景运门（内廷东路入口）
  xiqing:    { x: 290, y: 105 }, // 锡庆门 / 九龙壁（宁寿宫入口）
}

/* 通道邻接图 —— 只连真实可走的开放通道 */
const GRAPH: Record<string, string[]> = {
  entrance:  ['taihemen'],
  taihemen:  ['entrance', 'qianqing', 'xihe'],
  qianqing:  ['taihemen', 'longzong', 'jingyun'],
  xihe:      ['taihemen', 'spot-ceramic'],
  longzong:  ['qianqing', 'spot-cining', 'spot-shoukang'],
  jingyun:   ['qianqing', 'spot-clock', 'spot-yanxi', 'xiqing'],
  xiqing:    ['jingyun', 'spot-treasure'],
  'spot-ceramic':  ['xihe'],
  'spot-cining':   ['longzong', 'spot-shoukang'],
  'spot-shoukang': ['longzong', 'spot-cining'],
  'spot-clock':    ['jingyun', 'spot-yanxi'],
  'spot-yanxi':    ['jingyun', 'spot-clock'],
  'spot-treasure': ['xiqing'],
}

/* BFS 找最短通道 */
function findRoutePath(fromId: string | null, toId: string): string {
  const from = fromId ?? 'entrance'
  if (from === toId) return ''

  const queue: { node: string; path: string[] }[] = [{ node: from, path: [from] }]
  const visited = new Set([from])

  while (queue.length) {
    const { node, path } = queue.shift()!
    for (const neighbor of GRAPH[node] ?? []) {
      if (visited.has(neighbor)) continue
      const newPath = [...path, neighbor]
      if (neighbor === toId) {
        const allNodes: Record<string, { x: number; y: number }> = { ...NODES, ...SPOT_POS }
        return newPath
          .map((n, i) => {
            const p = allNodes[n]
            return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
          })
          .join(' ')
      }
      visited.add(neighbor)
      queue.push({ node: neighbor, path: newPath })
    }
  }
  return ''
}

const COLD_SPOT_FLAVOR: Record<string, string> = {
  'spot-yanxi': '灵沼轩的地下图纸需要你去拼凑……',
  'spot-shoukang': '皇太后的暗格里，藏着一串以她头发穿制的佛珠……',
  'spot-cining': '孝庄下嫁之谜的真相，或许就藏在这宫墙的某块砖下……',
  'spot-clock': '铜壶滴漏中那片从未见过的金属薄片，在等你解读……',
  'spot-treasure': '凤冠上消失的两颗东珠，似乎指向一段无人知晓的往事……',
  'spot-ceramic': '碎瓷片上的四字款识，与展出真品有着微妙差异……',
}

export default function Navigate() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('spotId')

  const [entered, setEntered] = useState(false)
  const [showReward, setShowReward] = useState(false)
  const [rewardFading, setRewardFading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleDismissReward = () => {
    setRewardFading(true)
    setTimeout(() => {
      navigate(`/narrative?spotId=${spotId}`)
    }, 700)
  }

  if (!spotId || !SPOTS[spotId]) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-ink-dim mb-4">未选择目标地点</p>
        <button
          onClick={() => navigate('/explore')}
          className="h-12 px-8 rounded-full bg-cinnabar text-white text-base font-medium transition-transform active:scale-[0.96]"
        >
          返回秘辛地图
        </button>
      </div>
    )
  }

  const spot = SPOTS[spotId]
  const route = getRouteTo(spotId)
  const crowd = getCrowdLevel(spotId)
  const isColdSpot = crowd === 'smooth'

  const completed = getCompletedSpots()
  const lastCompleted = completed.length > 0 ? completed[completed.length - 1] : null
  const routePath = useMemo(() => findRoutePath(lastCompleted, spotId), [lastCompleted, spotId])

  const handleArrived = () => {
    // 1. 标记已勘验
    addCompletedSpot(spotId)
    // 2. 解锁秘辛
    unlockNarrative(spotId)
    // 3. 清除当前目标
    setCurrentTarget(null)
    // 4. 弹出奖励（不再自动消失）
    setShowReward(true)
  }

  const handleChangeTarget = () => {
    setCurrentTarget(null)
    navigate('/explore')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div
        className={`flex-1 flex flex-col px-5 pt-8 pb-6 transition-all duration-500 ease-out ${
          entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="mb-4">
          <p className="text-[11px] text-gold tracking-[0.1em] font-serif uppercase mb-2">
            Navigate · 路线引导
          </p>
          <h1 className="font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink mb-2">
            前往 {spot.shortName}
          </h1>
          <p className="text-[13px] text-ink-dim leading-[1.6]">{spot.location}</p>
        </div>

        {/* Forbidden City mini map */}
        <div className="relative w-full h-[280px] rounded-xl border border-scroll-line bg-paper-deep overflow-hidden mb-4">
          <svg className="w-full h-full" viewBox="0 0 400 320" fill="none" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill="#B8923A" />
              </marker>
            </defs>

            {/* --- 宫墙轮廓 --- */}
            {/* 外城墙 */}
            <rect x="32" y="12" width="336" height="296" rx="1" stroke="#B8AE9A" strokeWidth="1.5" fill="none" opacity="0.55" />
            {/* 北城墙加粗 */}
            <line x1="32" y1="12" x2="368" y2="12" stroke="#B8AE9A" strokeWidth="2.5" opacity="0.5" />
            {/* 南城墙（午门）加粗 */}
            <line x1="32" y1="308" x2="368" y2="308" stroke="#B8AE9A" strokeWidth="2.5" opacity="0.5" />

            {/* 外朝 / 内廷分界 —— 保和殿北 / 乾清门一线 */}
            <line x1="32" y1="168" x2="368" y2="168" stroke="#C4BBA8" strokeWidth="0.8" opacity="0.3" strokeDasharray="4 3" />

            {/* --- 中轴线 --- */}
            <line x1="200" y1="12" x2="200" y2="308" stroke="#C4BBA8" strokeWidth="0.6" opacity="0.22" strokeDasharray="3 3" />

            {/* --- 主要通道门（小方块标记） --- */}
            {/* 熙和门 — 外朝西路 */}
            <rect x={NODES.xihe.x - 4} y={NODES.xihe.y - 3} width="8" height="6" fill="#B8AE9A" opacity="0.5" rx="1" />
            <text x={NODES.xihe.x} y={NODES.xihe.y + 12} textAnchor="middle" fontSize="7" fill="#B8AE9A" opacity="0.5" fontFamily="LXGW WenKai, serif">熙和门</text>
            {/* 隆宗门 — 外西路入口 */}
            <rect x={NODES.longzong.x - 4} y={NODES.longzong.y - 3} width="8" height="6" fill="#B8AE9A" opacity="0.5" rx="1" />
            <text x={NODES.longzong.x} y={NODES.longzong.y - 8} textAnchor="middle" fontSize="7" fill="#B8AE9A" opacity="0.5" fontFamily="LXGW WenKai, serif">隆宗门</text>
            {/* 景运门 — 内廷东路入口 */}
            <rect x={NODES.jingyun.x - 4} y={NODES.jingyun.y - 3} width="8" height="6" fill="#B8AE9A" opacity="0.5" rx="1" />
            <text x={NODES.jingyun.x} y={NODES.jingyun.y - 8} textAnchor="middle" fontSize="7" fill="#B8AE9A" opacity="0.5" fontFamily="LXGW WenKai, serif">景运门</text>
            {/* 锡庆门（九龙壁）— 宁寿宫入口 */}
            <rect x={NODES.xiqing.x - 4} y={NODES.xiqing.y - 3} width="8" height="6" fill="#B8AE9A" opacity="0.5" rx="1" />
            <text x={NODES.xiqing.x} y={NODES.xiqing.y - 8} textAnchor="middle" fontSize="7" fill="#B8AE9A" opacity="0.5" fontFamily="LXGW WenKai, serif">锡庆门</text>

            {/* --- 区域标注 --- */}
            <text x="200" y="100" textAnchor="middle" fontSize="8" fill="#C4BBA8" opacity="0.4" fontFamily="LXGW WenKai, serif">内廷</text>
            <text x="200" y="200" textAnchor="middle" fontSize="8" fill="#C4BBA8" opacity="0.4" fontFamily="LXGW WenKai, serif">外朝</text>
            <text x="200" y="318" textAnchor="middle" fontSize="8" fill="#C4BBA8" opacity="0.45" fontFamily="LXGW WenKai, serif">午门</text>
            <text x="200" y="24" textAnchor="middle" fontSize="8" fill="#C4BBA8" opacity="0.4" fontFamily="LXGW WenKai, serif">神武门</text>

            {/* --- 所有点位 --- */}
            {Object.entries(SPOT_POS).map(([id, pos]) => {
              const isTarget = id === spotId
              const isCompleted = completed.includes(id)
              const isStart = lastCompleted === id
              const fill = isTarget ? '#A32626' : isCompleted ? '#B8923A' : isStart ? '#6B6860' : '#D4CFC3'
              const r = isTarget ? 6 : 4
              return (
                <g key={id}>
                  <circle cx={pos.x} cy={pos.y} r={r + 2} fill={fill} opacity="0.12" />
                  <circle cx={pos.x} cy={pos.y} r={r} fill={fill} />
                  {!isTarget && (
                    <text
                      x={pos.x}
                      y={pos.y + (pos.x > 250 ? 14 : -8)}
                      textAnchor="middle"
                      fontSize="8"
                      fill={isCompleted ? '#B8923A' : '#C4BBA8'}
                      opacity={isCompleted ? 0.7 : 0.45}
                      fontFamily="LXGW WenKai, serif"
                    >
                      {SPOTS[id].shortName}
                    </text>
                  )}
                </g>
              )
            })}

            {/* --- 入口标记（午门） --- */}
            {!lastCompleted && (
              <g>
                <circle cx={NODES.entrance.x} cy={NODES.entrance.y} r={5} fill="#6B6860" />
                <text x={NODES.entrance.x} y={NODES.entrance.y - 10} textAnchor="middle" fontSize="8" fill="#6B6860" opacity="0.7" fontFamily="LXGW WenKai, serif">入口</text>
              </g>
            )}

            {/* --- 路线（沿真实通道的折线） --- */}
            {routePath && (
              <>
                <path d={routePath} stroke="#B8923A" strokeWidth="2" strokeDasharray="5 4" opacity="0.55" fill="none" markerEnd="url(#arrow)" />
                <circle r="3" fill="#B8923A" opacity="0.8">
                  <animateMotion dur="2.5s" repeatCount="indefinite" path={routePath} />
                </circle>
              </>
            )}

            {/* --- 目标点位高亮 --- */}
            {(() => {
              const end = SPOT_POS[spotId]
              if (!end) return null
              return (
                <g>
                  <circle cx={end.x} cy={end.y} r={12} fill="none" stroke="#A32626" strokeWidth="1" opacity="0.25">
                    <animate attributeName="r" values="10;18;10" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={end.x} cy={end.y} r={7} fill="#A32626" />
                  <circle cx={end.x} cy={end.y} r={3} fill="#fff" />
                  <text
                    x={end.x}
                    y={end.y + (end.x > 250 ? 20 : -14)}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#A32626"
                    fontWeight="500"
                    fontFamily="LXGW WenKai, serif"
                  >
                    {spot.shortName}
                  </text>
                </g>
              )
            })()}
          </svg>

          {/* 距离角标 */}
          <div className="absolute top-3 right-3 bg-cinnabar/90 text-white rounded-full px-3 py-1 shadow-sm">
            <p className="text-[12px] font-medium">{route.distance} 米</p>
          </div>
        </div>

        {/* Route info card */}
        <div className="card-elevated rounded-xl p-5 mb-4">
          {/* Nearby hint */}
          {route.isNearby && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-[13px] text-emerald-700 text-center">
                你似乎已在此地附近
              </p>
            </div>
          )}

          {/* Cold spot flavor */}
          {isColdSpot && COLD_SPOT_FLAVOR[spotId] && (
            <div className="mb-4 p-3 rounded-lg bg-paper-deep border border-gold/20">
              <p className="text-[12px] text-gold/80 leading-[1.6] text-center italic">
                {COLD_SPOT_FLAVOR[spotId]}
              </p>
            </div>
          )}

          {/* Distance & time */}
          <div className="rounded-lg bg-paper-deep border border-scroll-line p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-dim">步行距离</span>
              <span className="text-[15px] text-ink font-medium">{route.distance} 米</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-dim">预计时间</span>
              <span className="text-[15px] text-ink font-medium">约 {route.walkTime} 分钟</span>
            </div>
            <div className="w-full h-px bg-scroll-line/30" />
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  crowd === 'smooth'
                    ? 'bg-emerald-500'
                    : crowd === 'moderate'
                    ? 'bg-amber-500'
                    : 'bg-cinnabar'
                }`}
              />
              <span className="text-[12px] text-ink-dim">
                {crowd === 'smooth'
                  ? '当前区域人流平稳，建议立即前往'
                  : crowd === 'moderate'
                  ? '当前区域人流中等，可正常前往'
                  : '当前区域较为拥挤，建议稍后再去'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="mt-auto space-y-3">
          <button
            onClick={handleArrived}
            disabled={showReward}
            className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(163,38,38,0.15)]"
          >
            {showReward ? '勘验完成 · 解锁中...' : '我已到达'}
          </button>
          <button
            onClick={handleChangeTarget}
            disabled={showReward}
            className="h-12 w-full rounded-full border border-cinnabar text-cinnabar bg-transparent text-[15px] font-medium tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50"
          >
            更换目标
          </button>
        </div>
      </div>

      {/* Reward popup overlay */}
      {showReward && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-700 ${
            rewardFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="bg-white rounded-2xl p-8 max-w-[320px] w-full mx-6 text-center animate-seal-stamp">
            {/* Medal image */}
            <div className="w-52 h-52 mx-auto mb-5">
              <img
                src={`/assets/medal/${spot.shortName}.png`}
                alt={`${spot.shortName}勋章`}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="font-display text-[20px] text-ink mb-1">{spot.name} 已勘验</h3>
            <p className="text-[13px] text-ink-dim mb-2">秘辛已解锁，收录于密档</p>
            <div className="mt-4 p-3 rounded-lg bg-gold-dim border border-gold/10 mb-5">
              <p className="text-[12px] text-gold/70">{spot.teaser}</p>
            </div>
            <button
              onClick={handleDismissReward}
              disabled={rewardFading}
              className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-50"
            >
              收好勋章
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
