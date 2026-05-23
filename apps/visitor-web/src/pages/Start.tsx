import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Start() {
  const navigate = useNavigate()
  const [contentReady, setContentReady] = useState(false)
  const [entering, setEntering] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setContentReady(true), 1550)
    return () => clearTimeout(t)
  }, [])

  const playEntryCue = useCallback(() => {
    if (typeof window === 'undefined') return

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextCtor) return

    const ctx = audioContextRef.current ?? new AudioContextCtor()
    audioContextRef.current = ctx
    void ctx.resume?.()

    const now = ctx.currentTime
    const chime = ctx.createOscillator()
    const chimeGain = ctx.createGain()
    chime.type = 'sine'
    chime.frequency.setValueAtTime(1567.98, now)
    chime.frequency.exponentialRampToValueAtTime(1046.5, now + 0.65)
    chimeGain.gain.setValueAtTime(0.001, now)
    chimeGain.gain.exponentialRampToValueAtTime(0.18, now + 0.015)
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.05)
    chime.connect(chimeGain).connect(ctx.destination)
    chime.start(now)
    chime.stop(now + 1.1)

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.42, ctx.sampleRate)
    const channel = noiseBuffer.getChannelData(0)
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length)
    }

    const paper = ctx.createBufferSource()
    const paperFilter = ctx.createBiquadFilter()
    const paperGain = ctx.createGain()
    paper.buffer = noiseBuffer
    paperFilter.type = 'highpass'
    paperFilter.frequency.value = 1200
    paperGain.gain.setValueAtTime(0.001, now + 0.48)
    paperGain.gain.linearRampToValueAtTime(0.16, now + 0.54)
    paperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.88)
    paper.connect(paperFilter).connect(paperGain).connect(ctx.destination)
    paper.start(now + 0.5)
    paper.stop(now + 0.92)
  }, [])

  const handleEnter = useCallback(() => {
    if (entering) return
    setEntering(true)
    playEntryCue()

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(55)
    }

    setTimeout(() => navigate('/interest'), 520)
  }, [entering, navigate, playEntryCue])

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
        <h1 className="start-title start-imprint" data-testid="start-title">
          <span>故宫叙境 ·</span>
          <span>翻阅六百年</span>
        </h1>

        <p className="start-subtitle start-imprint">
          扫码进入剧情，根据线索探访故宫冷门秘境。
          <span>历史的每一块青砖，都在等待精确的解读。</span>
        </p>

        <button
          type="button"
          className="start-enter-btn start-imprint"
          onClick={handleEnter}
          aria-label="开始探索"
        >
          <span>开始</span>
          <span>探索</span>
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
