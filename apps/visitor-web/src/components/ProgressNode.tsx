interface ProgressNodeProps {
  total: number
  current: number
}

export default function ProgressNode({ total, current }: ProgressNodeProps) {
  return (
    <div className="flex items-center justify-center gap-0 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`rounded-full transition-all duration-400 ${
              i < current
                ? 'h-[10px] w-[10px] bg-bamboo'
                : i === current
                ? 'h-3 w-3 bg-cinnabar ring-1 ring-cinnabar'
                : 'h-[10px] w-[10px] border border-scroll-line bg-transparent'
            }`}
          />
          {i < total - 1 && (
            <div
              className={`w-6 h-px mx-1 ${
                i < current ? 'bg-bamboo' : 'border-t border-dashed border-scroll-line'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
