import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function Start() {
  const navigate = useNavigate()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleEnter = () => {
    navigate('/interest')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        {/* Title */}
        <h1
          className={`mb-2 text-center font-display text-[28px] leading-[1.25] tracking-[0.04em] text-ink transition-all duration-500 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          叙境 · 故宫寻踪
        </h1>

        <p
          className={`mb-10 text-center text-[14px] leading-[1.7] tracking-[0.02em] text-ink-dim transition-all duration-500 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '80ms' }}
        >
          扫码进入，开启你的宫廷探索
        </p>

        {/* Location card */}
        <div
          className={`card-elevated w-full rounded-xl p-5 transition-all duration-500 ease-out ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '160ms' }}
        >
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-cinnabar"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <p className="text-[13px] text-ink-faint">当前位置</p>
              <p className="text-[15px] font-medium text-ink">故宫 · 午门</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleEnter}
          className={`mt-10 h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium tracking-[0.04em] text-white transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-[0_4px_16px_rgba(163,38,38,0.15)] ${
            entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '240ms' }}
        >
          进入叙境
        </button>
      </div>
    </div>
  )
}
