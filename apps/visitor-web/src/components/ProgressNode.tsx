interface ProgressNodeProps {
  total: number
  current: number
}

export default function ProgressNode({ total, current }: ProgressNodeProps) {
  return (
    <div className="flex items-center justify-center gap-1 py-5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`rounded-full transition-[width,height,background-color,box-shadow] duration-500 ${
              i < current
                ? 'h-[10px] w-[10px] bg-cinnabar'
                : i === current
                ? 'h-[10px] w-[10px] bg-cinnabar ring-4 ring-cinnabar-light'
                : 'h-[8px] w-[8px] bg-scroll-line'
            }`}
          />
          {i < total - 1 && (
            <div
              className={`w-8 h-px mx-1.5 ${
                i < current ? 'bg-scroll-line' : 'bg-scroll-line/40'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
