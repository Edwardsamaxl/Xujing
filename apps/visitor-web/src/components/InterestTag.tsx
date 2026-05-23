interface InterestTagProps {
  label: string
  selected: boolean
  onClick: () => void
  index: number
}

export default function InterestTag({ label, selected, onClick, index }: InterestTagProps) {
  const delays = ['0ms', '60ms', '120ms', '180ms', '240ms', '300ms']

  return (
    <button
      onClick={onClick}
      className={`group relative h-[72px] w-full rounded-lg transition-all duration-300 flex flex-col items-center justify-center gap-1
        ${selected
          ? 'bg-cinnabar-light border border-cinnabar text-cinnabar'
          : 'bg-paper-deep border border-scroll-line text-ink-dim hover:border-gold/30 hover:text-ink'
        }
      `}
      style={{ animationDelay: delays[index] }}
    >
      {/* Seal dot */}
      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${selected ? 'bg-cinnabar scale-125' : 'bg-ink-faint/30 group-hover:bg-gold/40'}`} />
      <span className="text-[15px] font-medium tracking-[0.04em] font-display">{label}</span>
      {/* Selected indicator line */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300 ${selected ? 'w-8 bg-cinnabar' : 'w-0 bg-transparent'}`} />
    </button>
  )
}
