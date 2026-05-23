interface TopNavProps {
  title: string
  showBack?: boolean
  onBack?: () => void
}

export default function TopNav({ title, showBack, onBack }: TopNavProps) {
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
      <span className="text-[15px] font-medium tracking-[0.08em] text-ink uppercase font-display">{title}</span>
    </div>
  )
}
