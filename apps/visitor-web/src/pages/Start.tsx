import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Start() {
  const navigate = useNavigate()
  const [entering, setEntering] = useState(false)

  const handleEnter = useCallback(() => {
    if (entering) return
    setEntering(true)
    window.setTimeout(() => navigate('/interest'), 900)
  }, [entering, navigate])

  return (
    <main className={`start-screen ${entering ? 'start-screen--entering' : ''}`}>
      <div className="start-content">
        <p className="start-title">叙境</p>
        <h1 className="start-subtitle">故宫密档寻踪</h1>
        <p className="start-line">尘光入殿，旧档将启</p>
      </div>

      <button
        type="button"
        className="start-btn"
        onClick={handleEnter}
        aria-label="进入"
      >
        进入
      </button>

      <div className="start-wipe" aria-hidden="true" />
    </main>
  )
}
