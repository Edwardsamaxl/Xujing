interface InterestTagProps {
  label: string
  selected: boolean
  onClick: () => void
}

export default function InterestTag({ label, selected, onClick }: InterestTagProps) {
  return (
    <button
      onClick={onClick}
      className={`h-11 w-full rounded-full text-base font-medium transition-all duration-200 flex items-center justify-center ${
        selected
          ? 'border border-cinnabar bg-cinnabar-light text-cinnabar'
          : 'border border-scroll-line bg-paper-deep text-ink-light'
      }`}
    >
      {label}
    </button>
  )
}
