import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getVisitorId } from '../utils/storage'
import ScrollCard from '../components/ScrollCard'

export default function Start() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleStart = () => {
    const visitorId = getVisitorId()
    if (visitorId) {
      navigate('/narrative')
    } else {
      navigate('/interest')
    }
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-between px-5 pt-16 pb-8 transition-all duration-400 ease-out ${
        entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-[480px]">
        {/* Logo / Seal */}
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-sm border-2 border-cinnabar">
          <svg viewBox="0 0 48 48" className="h-7 w-7 text-cinnabar" fill="currentColor">
            <path d="M24 4L28 18H44L31 27L36 42L24 33L12 42L17 27L4 18H20L24 4Z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-6 text-center font-display text-[28px] leading-[1.3] tracking-[0.04em] text-ink">
          故宫密档·寻踪
        </h1>

        {/* Scroll Card with rules */}
        <ScrollCard className="w-full">
          <p className="text-center text-base leading-relaxed text-ink-light">
            扫码进入剧情，根据线索探访故宫冷门秘境。
            <br />
            完成三段寻踪任务，解锁专属纪念徽章。
          </p>
        </ScrollCard>
      </div>

      {/* CTA Button */}
      <div className="w-full max-w-[480px]">
        <button
          onClick={handleStart}
          className="h-12 w-full rounded-full bg-cinnabar text-base font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          开启旅程
        </button>
      </div>
    </div>
  )
}
