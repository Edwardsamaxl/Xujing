import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DRAG_LIMIT = 132
const OPEN_THRESHOLD = 0.72

type EntryPhase = 'gate' | 'transition' | 'trigger' | 'scroll'

function DustCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!active) return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let frame = 0
    let animationId = 0
    const particles = Array.from({ length: 56 }, (_, index) => ({
      x: (index * 41) % 320,
      y: (index * 83) % 760,
      radius: 0.45 + (index % 5) * 0.16,
      speed: 0.18 + (index % 7) * 0.035,
      alpha: 0.16 + (index % 4) * 0.05,
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      for (const particle of particles) {
        const drift = Math.sin((frame + particle.x) * 0.012) * 9
        const x = width * 0.5 + (particle.x - 160) * 0.75 + drift
        const y = (particle.y + frame * particle.speed) % (height + 80)
        const beamCenter = width * 0.5
        const distance = Math.abs(x - beamCenter) / Math.max(width * 0.36, 1)
        const beamMask = Math.max(0, 1 - distance)

        context.beginPath()
        context.fillStyle = `rgba(248, 226, 173, ${particle.alpha * beamMask})`
        context.arc(x, y - 40, particle.radius, 0, Math.PI * 2)
        context.fill()
      }

      context.globalCompositeOperation = 'source-over'
      frame += 1
      animationId = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return <canvas ref={canvasRef} className="entry-dust-canvas" aria-hidden="true" />
}

function DoorStuds({ side }: { side: 'left' | 'right' }) {
  return (
    <>
      {[0, 1, 2, 3, 4].map((row) =>
        [0, 1, 2].map((column) => (
          <span
            key={`${side}-${row}-${column}`}
            className="entry-door-stud"
            style={{
              left: `${22 + column * 28}%`,
              top: `${18 + row * 15}%`,
            }}
          />
        )),
      )}
    </>
  )
}

export default function Start() {
  const navigate = useNavigate()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dragStartY = useRef(0)
  const hasBuzzed = useRef(false)
  const [phase, setPhase] = useState<EntryPhase>('gate')
  const [dragProgress, setDragProgress] = useState(0)

  const isOpening = phase !== 'gate'
  const doorProgress = isOpening ? 1 : dragProgress

  const triggerHaptic = useCallback((duration = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration)
    }
  }, [])

  const playDoorSound = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    audio.volume = 0.72
    void audio.play().catch(() => {
      // Mobile browsers may block audio until a stronger user gesture.
    })
  }, [])

  const openGate = useCallback(() => {
    if (phase !== 'gate') return

    setDragProgress(1)
    setPhase('transition')
    playDoorSound()
    triggerHaptic(15)

    window.setTimeout(() => {
      setPhase('trigger')
    }, 2600)
  }, [phase, playDoorSound, triggerHaptic])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (phase !== 'gate') return

    dragStartY.current = event.clientY
    hasBuzzed.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [phase])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (phase !== 'gate' || dragStartY.current === 0) return

    const distance = Math.max(0, event.clientY - dragStartY.current)
    const nextProgress = Math.min(distance / DRAG_LIMIT, 1)
    setDragProgress(nextProgress)

    if (!hasBuzzed.current && nextProgress > 0.08) {
      hasBuzzed.current = true
      triggerHaptic(15)
    }

    if (nextProgress >= 1) {
      openGate()
    }
  }, [openGate, phase, triggerHaptic])

  const handlePointerUp = useCallback(() => {
    if (phase !== 'gate') return

    dragStartY.current = 0
    setDragProgress((current) => {
      if (current >= OPEN_THRESHOLD) {
        window.setTimeout(openGate, 20)
        return 1
      }

      return 0
    })
  }, [openGate, phase])

  const handleBrickClick = useCallback(() => {
    if (phase !== 'trigger') return

    setPhase('scroll')
    triggerHaptic(18)
    window.setTimeout(() => navigate('/explore'), 920)
  }, [navigate, phase, triggerHaptic])

  return (
    <main className={`entry-screen entry-screen--${phase}`} style={{ '--entry-open': doorProgress } as React.CSSProperties}>
      <audio ref={audioRef} src="/assets/sfx/door_creak.mp3" preload="auto" />

      <div className="entry-depth" aria-hidden="true">
        <div className="entry-stone-grid" />
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            className="entry-footprint-pair"
            style={{ '--step': index } as React.CSSProperties}
          >
            <i />
            <i />
          </span>
        ))}
      </div>

      <section className="entry-gate" aria-label="入宫仪式">
        <div className="entry-roof" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="entry-eaves" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} />
          ))}
        </div>

        <div className="entry-door-frame">
          <div className="entry-light-beam" aria-hidden="true" />
          <DustCanvas active={phase === 'transition' || phase === 'trigger'} />

          <div className="entry-door entry-door--left" aria-hidden="true">
            <DoorStuds side="left" />
          </div>
          <div className="entry-door entry-door--right" aria-hidden="true">
            <DoorStuds side="right" />
          </div>

          <button
            type="button"
            className="entry-knocker"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={() => {
              if (dragProgress > OPEN_THRESHOLD) openGate()
            }}
            aria-label="向下拖拽开启宫门"
            style={{ '--pull': `${doorProgress * 78}px` } as React.CSSProperties}
          >
            <span className="entry-knocker-ring" />
            <span className="entry-knocker-beast" />
          </button>
        </div>

        <div className="entry-brand">
          <p>叙境</p>
          <h1>故宫密档寻踪</h1>
        </div>

        <p className="entry-drag-hint">向下拖拽铺首</p>
      </section>

      <p className="entry-ink-line">尘光入殿，旧档将启</p>

      <button
        type="button"
        className="entry-brick-trigger"
        onClick={handleBrickClick}
        aria-label="点击发光古砖进入剧情线"
      >
        <span className="entry-brick-crack" />
      </button>

      <div className="entry-scroll-wipe" aria-hidden="true" />
    </main>
  )
}
