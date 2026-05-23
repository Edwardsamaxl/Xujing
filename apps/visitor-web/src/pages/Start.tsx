import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Phase = 'silent' | 'line-grow' | 'wipe' | 'content'

const ROLES = [
  { id: 'historian', label: '史官', desc: '以编年体视角，追踪档案的时空脉络' },
  { id: 'detective', label: '侦辑', desc: '以刑侦逻辑，还原事件的因果链条' },
  { id: 'curator', label: '策展', desc: '以博物学眼光，解构器物的象征体系' },
]

export default function Start() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('silent')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('line-grow'), 500)
    const t2 = setTimeout(() => setPhase('wipe'), 800)
    const t3 = setTimeout(() => setPhase('content'), 1400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  const handleEnter = useCallback(() => {
    if (!selectedRole || entering) return
    setEntering(true)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.volume = 0.8
      void audioRef.current.play().catch(() => {})
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 20, 50])
    }
    localStorage.setItem('xujing_role', selectedRole)
    setTimeout(() => navigate('/interest'), 900)
  }, [selectedRole, entering, navigate])

  return (
    <main
      data-testid="start-screen"
      className={`start-screen start-screen--${phase} ${entering ? 'start-screen--entering' : ''}`}
    >
      <audio ref={audioRef} src="/assets/sfx/unfold_chime.mp3" preload="auto" />

      <div className="start-red-line" aria-hidden="true" />
      <div className="start-shutter start-shutter--left" aria-hidden="true" />
      <div className="start-shutter start-shutter--right" aria-hidden="true" />

      <div className="start-content">
        <h1 className="start-title" data-testid="start-title">
          {'故宫叙境'.split('').map((c, i) => (
            <span key={i}>{c}</span>
          ))}
          <span className="start-title-divider">·</span>
          {'翻阅六百年'.split('').map((c, i) => (
            <span key={i + 5}>{c}</span>
          ))}
        </h1>

        <p className="start-subtitle start-subtitle--1">
          历史的每一块青砖，都在等待精确的解读。
        </p>
        <p className="start-subtitle start-subtitle--2">
          请确立你的勘验视角：
        </p>

        <div className="start-roles">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`start-role-card ${selectedRole === role.id ? 'start-role-card--selected' : ''}`}
              onClick={() => setSelectedRole(role.id)}
            >
              <span className="start-role-label">{role.label}</span>
              <span className="start-role-desc">{role.desc}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="start-enter-btn"
          onClick={handleEnter}
          disabled={!selectedRole || phase !== 'content'}
          aria-label="落印，开启勘验"
        >
          落印，开启勘验
        </button>
      </div>

      <div className="start-fade-wipe" aria-hidden="true" />
    </main>
  )
}
