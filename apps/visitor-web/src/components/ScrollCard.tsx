interface ScrollCardProps {
  children: React.ReactNode
  unlocked?: boolean
  className?: string
}

export default function ScrollCard({ children, unlocked, className = '' }: ScrollCardProps) {
  return (
    <div
      className={`rounded-lg bg-paper-deep px-5 py-5 border-y border-scroll-line ${
        unlocked ? 'border-t-2 border-t-gold' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
