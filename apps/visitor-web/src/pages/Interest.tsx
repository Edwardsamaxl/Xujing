import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InterestTag from '../components/InterestTag'
import { setVisitorId } from '../utils/storage'

const TAGS = ['历史', '建筑', '人物', '亲子', '悬疑', '工艺']

export default function Interest() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>([])
  const [entered, setEntered] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const toggle = (tag: string) => {
    setSelected(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      }
      if (prev.length >= 2) {
        return prev
      }
      return [...prev, tag]
    })
  }

  const handleStart = async () => {
    if (selected.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/visitor/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: 'demo', interestTags: selected }),
      })
      const data = await res.json()
      setVisitorId(data.id)
      navigate('/narrative')
    } catch {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <div className="flex gap-2 mb-4">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
        <p className="text-[13px] text-ink-light">正在生成你的专属剧情...</p>
      </div>
    )
  }

  return (
    <div
      className={`flex min-h-screen flex-col px-5 pt-12 pb-8 transition-all duration-400 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      <div className="mx-auto w-full max-w-[480px]">
        <h1 className="mb-2 text-center font-display text-2xl leading-[1.35] tracking-[0.03em] text-ink">
          选择你的探索偏好
        </h1>
        <p className="mb-8 text-center text-[13px] leading-[1.5] tracking-[0.02em] text-ink-light">
          这将决定你听到的故事风格（最多选 2 个）
        </p>

        <div className="mb-auto grid grid-cols-2 gap-3">
          {TAGS.map(tag => (
            <InterestTag
              key={tag}
              label={tag}
              selected={selected.includes(tag)}
              onClick={() => toggle(tag)}
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={selected.length === 0}
          className="mt-10 h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96] disabled:bg-ink-faint disabled:text-paper disabled:active:scale-100"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          生成剧情
        </button>
      </div>
    </div>
  )
}
