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
      if (prev.includes(tag)) return prev.filter(t => t !== tag)
      if (prev.length >= 1) return prev
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
      localStorage.setItem('xujing_interest_tags', JSON.stringify(selected))
      navigate('/narrative')
    } catch {
      setVisitorId('demo-' + Date.now())
      localStorage.setItem('xujing_interest_tags', JSON.stringify(selected))
      navigate('/narrative')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 bg-paper">
        <div className="flex gap-2 mb-4">
          <div className="loader-dot" />
          <div className="loader-dot" />
          <div className="loader-dot" />
        </div>
        <p className="text-[13px] text-ink-dim tracking-[0.04em]">正在生成你的专属密档...</p>
      </div>
    )
  }

  return (
    <div className={`flex min-h-screen flex-col px-6 pt-12 pb-8 bg-paper transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="mx-auto w-full max-w-[400px]">
        <div className="w-12 h-px bg-gold/40 mb-6" />

        <h1 className="mb-2 font-display text-[26px] leading-[1.3] tracking-[0.04em] text-ink">
          择趣
        </h1>
        <p className="mb-8 text-[13px] leading-[1.6] text-ink-dim">
          选择你的探索偏好，决定密档的叙事风格
          <span className="text-ink-faint">（最多选 1 个）</span>
        </p>

        {/* Tags grid */}
        <div className="grid grid-cols-2 gap-3 animate-stagger">
          {TAGS.map((tag, i) => (
            <InterestTag
              key={tag}
              label={tag}
              selected={selected.includes(tag)}
              onClick={() => toggle(tag)}
              index={i}
            />
          ))}
        </div>

        {/* Selected preview */}
        {selected.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-gold-dim border border-gold/10 animate-ink-bleed">
            <p className="text-[12px] text-gold/70 mb-1 tracking-[0.04em]">已选偏好</p>
            <div className="flex gap-2">
              {selected.map(tag => (
                <span key={tag} className="text-[14px] text-gold font-medium">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={selected.length === 0}
          className="mt-10 h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.06em] transition-all duration-200 ease-out active:scale-[0.96] disabled:bg-ink-faint/20 disabled:text-ink-faint/40 disabled:active:scale-100 hover:shadow-[0_4px_16px_rgba(163,38,38,0.15)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          生成密档
        </button>
      </div>
    </div>
  )
}
