interface ScrollCardProps {
  children: React.ReactNode
  unlocked?: boolean
  className?: string
}

export default function ScrollCard({ children, unlocked, className = '' }: ScrollCardProps) {
  return (
    <div
      className={`rounded-xl card-elevated border border-scroll-line px-5 py-5 ${unlocked ? 'card-gold-accent' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
