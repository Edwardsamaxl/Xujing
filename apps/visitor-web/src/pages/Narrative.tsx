import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ScrollCard from '../components/ScrollCard'
import ProgressNode from '../components/ProgressNode'
import TopNav from '../components/TopNav'
import { getVisitorId } from '../utils/storage'

interface Task {
  currentSpotName: string
  narrativeTitle: string
  narrativeText: string
  nextSpotId: string
  nextSpotName: string
  destinationHint: string
  taskIndex: number
  totalTasks: number
}

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
      .then(r => r.json())
      .then(data => {
        setTask(data)
        setLoading(false)
        setTimeout(() => setEntered(true), 50)
      })
      .catch(() => {
        setLoading(false)
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
        <p className="text-[13px] text-ink-light">正在生成剧情...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <p className="text-ink-light mb-4">暂无可用任务</p>
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

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav title="故宫密档" />

      <div className="flex-1 px-5 pt-4 pb-8">
        <ProgressNode total={totalTasks} current={currentTaskIndex} />

        <p className="mb-4 text-center text-[13px] text-ink-light">
          当前：{task.currentSpotName}
        </p>

        <div
          className={`transition-all duration-400 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <ScrollCard>
            <h2 className="mb-4 font-display text-[22px] leading-[1.4] tracking-[0.02em] text-ink">
              {task.narrativeTitle}
            </h2>
            <div className="mb-5 max-h-[calc(1.65*16px*6)] overflow-y-auto text-base leading-[1.65] tracking-[0.01em] text-ink">
              {task.narrativeText}
            </div>

            <div className="border-t border-scroll-line pt-4">
              <p className="mb-1 text-[13px] text-ink-light">线索指向 →</p>
              <p className="text-lg font-semibold text-cinnabar">{task.destinationHint}</p>
            </div>
          </ScrollCard>
        </div>

        <div className="mt-auto pt-8">
          <button
            onClick={() => navigate(`/check-in?spotId=${task.nextSpotId}`)}
            className="h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            前往{task.nextSpotName}
          </button>
        </div>
      </div>
    </div>
  )
}
