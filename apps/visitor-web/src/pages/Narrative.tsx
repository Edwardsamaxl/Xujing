import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getVisitorId } from '../utils/storage'
import { getTemplate } from '../data/narratives'

interface Task {
  currentSpotName: string
  narrativeTitle: string
  narrativeText: string
  nextSpotId: string
  nextSpotName: string
  destinationHint: string
  taskIndex: number
  totalTasks: number
  rewardHint?: string
  imageUrl?: string
}

const DEMO_TASKS: Record<string, Task> = {
  '0': {
    currentSpotName: '延禧宫',
    narrativeTitle: '东六宫里的西洋梦',
    narrativeText: '延禧宫为紫禁城东六宫之一，始建于明永乐十八年。宣统元年，隆裕太后下旨在延禧宫原址修建"水晶宫"——灵沼轩，拟以铜铁为骨架、玻璃为墙，地下一层蓄养金鱼，为中国宫廷建筑史上前所未有的西洋式水殿设计。',
    nextSpotId: 'spot-yanxi',
    nextSpotName: '延禧宫',
    destinationHint: '前往东六宫区域，寻找那座未完工的"水晶宫"',
    taskIndex: 0,
    totalTasks: 3,
    imageUrl: '/assets/yanxi/ig_03cedf7f9ef8bfb9016a111522b2bc8191b0784277f6418d8b - 副本.png',
  },
  '1': {
    currentSpotName: '寿康宫',
    narrativeTitle: '崇庆皇太后的福寿全归',
    narrativeText: '寿康宫位于紫禁城内廷外西路，始建于清乾隆元年。它是乾隆皇帝为生母崇庆皇太后钮祜禄氏专门建造的颐养之所。崇庆皇太后享年八十六岁，是清代最长寿的皇太后。',
    nextSpotId: 'spot-shoukang',
    nextSpotName: '寿康宫',
    destinationHint: '前往内廷外西路，探访乾隆为母亲建造的"老年公寓"',
    taskIndex: 1,
    totalTasks: 3,
  },
  '2': {
    currentSpotName: '慈宁宫',
    narrativeTitle: '皇太后的正宫',
    narrativeText: '慈宁宫位于紫禁城内廷外西路，始建于明嘉靖十五年。清代顺治十年重修，成为清代皇太后的正宫。孝庄文皇后、孝圣宪皇后等清代著名皇太后均曾居于此。',
    nextSpotId: 'spot-cining',
    nextSpotName: '慈宁宫',
    destinationHint: '前往内廷外西路，参观皇太后的正宫与雕塑馆',
    taskIndex: 2,
    totalTasks: 3,
    rewardHint: '这是最后一处密档地点，勘验完成后将解锁纪念册',
  },
}

const PROBE_OPTIONS = [
  '[调查工艺细节]',
  '[审问NPC/寻找线索]',
  '[跳过，直接启程]',
]

export default function Narrative() {
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    fetch('/api/narrative/next-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
    })
      .then(r => {
        if (!r.ok) throw new Error('API error')
        return r.json()
      })
      .then(data => {
        setTask(data)
        setLoading(false)
        setTimeout(() => setEntered(true), 50)
      })
      .catch(() => {
        const completed = JSON.parse(localStorage.getItem('xujing_completed_spots') || '[]')
        const idx = Math.min(completed.length, 2)
        const demoKey = String(idx) as keyof typeof DEMO_TASKS
        setTask(DEMO_TASKS[demoKey] || DEMO_TASKS['0'])
        setLoading(false)
        setTimeout(() => setEntered(true), 50)
      })
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <div className="flex gap-2 mb-4">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
        <p className="text-[13px] text-ink-dim">正在调取密档...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <p className="text-ink-dim mb-4">暂无可用密档</p>
        <button
          onClick={() => navigate('/')}
          className="h-12 px-8 rounded-full border border-cinnabar text-cinnabar text-base font-medium transition-transform active:scale-[0.96]"
        >
          返回首页
        </button>
      </div>
    )
  }

  const currentTaskIndex = task.taskIndex ?? 0
  const totalTasks = task.totalTasks ?? 3

  const storageTags = localStorage.getItem('xujing_interest_tags')
  const interestTags = storageTags ? JSON.parse(storageTags) : ['历史']
  const template = getTemplate(task.nextSpotId, interestTags[0] || '历史')
  const flavorText = template?.flavorText

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav title="剧情" showBack onBack={() => navigate('/')} />

      <div className="flex-1 px-5 pt-2 pb-8">
        {/* Progress indicator */}
        <div className="text-center mb-4">
          <span className="text-[12px] text-gold tracking-[0.06em]">
            第 {currentTaskIndex + 1} 站 / 共 {totalTasks} 站
          </span>
        </div>

        <div className={`transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          {/* Main card */}
          <div className="card-elevated rounded-xl overflow-hidden">
            {/* Scroll header decoration */}
            <div className="bg-gradient-to-b from-paper-deep to-paper h-[80px] relative border-b border-gold/20">
              <div className="absolute bottom-3 left-5">
                <p className="text-[11px] tracking-[0.1em] text-gold/70 font-serif uppercase">
                  卷 {currentTaskIndex + 1} / {totalTasks}
                </p>
              </div>
            </div>

            {/* Spot image */}
            {task.imageUrl && (
              <div className="h-[160px] overflow-hidden border-b border-gold/10">
                <img src={task.imageUrl} alt={task.currentSpotName} className="w-full h-full object-cover opacity-90" />
              </div>
            )}

            {/* Content */}
            <div className="px-5 pt-5 pb-5">
              {/* Spot name */}
              <h2 className="font-display text-[22px] text-ink">
                {task.currentSpotName}
              </h2>

              {/* Narrative title */}
              <p className="text-[18px] font-medium text-ink-dim mt-2">
                {task.narrativeTitle}
              </p>

              {/* AI voice indicator */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <span className="w-0.5 h-3 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-4 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2.5 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                  <span className="w-0.5 h-3.5 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                </div>
                <span className="text-[12px] text-ink-faint">AI 语音讲解中...</span>
              </div>

              {/* Narrative body */}
              <div className="text-[16px] leading-[1.85] text-ink mt-4">
                {task.narrativeText}
              </div>

              {/* Flavor text */}
              {flavorText && (
                <p className="text-center text-[15px] leading-[1.6] text-gold/70 italic font-serif mt-5">
                  "{flavorText}"
                </p>
              )}

              {/* Reward hint */}
              {task.rewardHint && (
                <div className="mt-4 p-3 rounded-lg bg-gold-dim border border-gold/10">
                  <p className="text-[12px] text-gold/80">{task.rewardHint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Probe options */}
          <div className="mt-6 space-y-3 animate-stagger">
            {PROBE_OPTIONS.map((option, idx) => (
              <button
                key={idx}
                className="w-full text-left p-4 rounded-xl border border-scroll-line bg-paper-deep hover:border-cinnabar/40 hover:bg-cinnabar-light transition-all duration-200 flex items-center gap-3"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                <span className="text-[15px] text-ink">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-auto pt-8">
          <button
            onClick={() => navigate('/navigate')}
            className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-[0_4px_20px_rgba(163,38,38,0.25)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            确定启程
          </button>
        </div>
      </div>
    </div>
  )
}
