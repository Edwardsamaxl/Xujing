import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Start() {
  const navigate = useNavigate()
  const [contentReady, setContentReady] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setContentReady(true), 1550)
    return () => clearTimeout(t)
  }, [])

  const handleEnter = useCallback(() => {
    if (entering) return
    setEntering(true)

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(55)
    }

    setTimeout(() => navigate('/interest'), 520)
  }, [entering, navigate])

  return (
    <main
      data-testid="start-screen"
      className={`start-screen ${contentReady ? 'start-screen--content' : ''} ${
        entering ? 'start-screen--entering' : ''
      }`}
    >
      <div className="start-paper-grain" aria-hidden="true" />
      <div className="start-emboss start-emboss--top" aria-hidden="true" />
      <div className="start-emboss start-emboss--bottom" aria-hidden="true" />

      <div className="start-content">
        <p className="start-kicker start-imprint">数字文旅勘验入口</p>
        <h1 className="start-title" data-testid="start-title">
          <span className="start-title-line start-imprint">故宫叙境</span>
          <span className="start-title-mark" aria-hidden="true">
            <span className="start-title-rule" />
            <span className="start-title-dot">·</span>
            <span className="start-title-rule" />
          </span>
          <span className="start-title-line start-imprint">翻阅六百年</span>
        </h1>

        <p className="start-subtitle start-imprint">
          扫码进入剧情，根据线索探访故宫冷门秘境。
          <span>历史的每一块青砖，都在等待精确的解读。</span>
        </p>

        <button
          type="button"
          className="start-enter-btn"
          onClick={handleEnter}
          aria-label="开始探索"
        >
          <span className="start-enter-btn-label">
            <span>开启</span>
            <span>勘验</span>
          </span>
        </button>
      </div>

      <div className="start-opening" aria-hidden="true">
        <div className="start-opening__panel start-opening__panel--left" />
        <div className="start-opening__panel start-opening__panel--right" />
        <div className="start-opening__line" />
      </div>
    </main>
  )
}
