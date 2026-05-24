import { useNavigate } from 'react-router-dom'

interface TopNavProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: React.ReactNode
  showAchievement?: boolean
}

export default function TopNav({ title, showBack, onBack, rightAction, showAchievement }: TopNavProps) {
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-50 flex h-14 items-center justify-center border-b border-scroll-line/50 bg-paper/80 backdrop-blur-md px-5">
      {showBack && (
        <button
          onClick={onBack}
          className="absolute left-4 flex h-10 w-10 items-center justify-center text-ink-dim transition-colors hover:text-ink"
          aria-label="返回"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <span className="text-[16px] font-medium tracking-[0.08em] text-ink uppercase font-display">{title}</span>
      <div className="absolute right-4 flex items-center gap-1">
        {showAchievement && (
          <button
            onClick={() => navigate('/complete')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-dim transition-colors hover:text-gold hover:bg-gold/5"
            aria-label="成就"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8.5" r="5" />
              <path d="M9.5 13.5L8 22l4-2 4 2-1.5-8.5" />
            </svg>
          </button>
        )}
        {rightAction}
      </div>
    </div>
  )
}
