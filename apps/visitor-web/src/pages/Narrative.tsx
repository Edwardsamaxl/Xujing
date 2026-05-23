import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getVisitorId, getInterestTag, isNarrativeUnlocked } from '../utils/storage'
import { SPOTS, getAllSpots } from '../data/spots'
import { getTemplatesBySpot, NARRATIVE_TEMPLATES } from '../data/narratives'

const DEFAULT_HINTS = [
  '问我关于这里的秘辛...',
  '问我关于建筑的工艺...',
  '问我有关历史的趣闻...',
  '试着问我：这扇窗为何半掩？',
]

interface NarrativeData {
  narrativeTitle: string
  narrativeText: string
  destinationHint: string
  nextSpotId: string
  nextSpotName: string
}

interface VoiceChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Narrative() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('spotId')

  const [entered, setEntered] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [userQuestion, setUserQuestion] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [narrativeData, setNarrativeData] = useState<NarrativeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [voiceHistory, setVoiceHistory] = useState<VoiceChatMessage[]>([])

  const interestTag = getInterestTag()
  const hintTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pre-compute spot data
  const spot = spotId ? SPOTS[spotId] : undefined
  const allTemplates = spotId ? getTemplatesBySpot(spotId) : []
  const availableTags = allTemplates.map((t) => t.interestTag)

  const [activeTag, setActiveTag] = useState(() => {
    if (interestTag && availableTags.includes(interestTag)) return interestTag
    return availableTags[0] || ''
  })

  const template = spotId ? allTemplates.find((t) => t.interestTag === activeTag) : undefined

  // Fetch AI-generated narrative from backend
  const fetchNarrative = useCallback(async () => {
    if (!spotId) return
    const visitorId = getVisitorId()
    if (!visitorId) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/narrative/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, spotId, interestTag: activeTag }),
      })
      if (!res.ok) throw new Error('Failed to fetch narrative')
      const data = await res.json()
      setNarrativeData(data)
    } catch (e) {
      console.error(e)
      // Fallback to static template
      if (template) {
        setNarrativeData({
          narrativeTitle: template.title,
          narrativeText: template.baseContent,
          destinationHint: '',
          nextSpotId: '',
          nextSpotName: '',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [spotId, activeTag, template])

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [navigate])

  useEffect(() => {
    fetchNarrative()
  }, [fetchNarrative])

  // Reset hint index when spot changes
  useEffect(() => {
    setHintIndex(0)
  }, [spotId])

  // Rotate hint messages
  const hints = template?.hookQuestions?.length ? template.hookQuestions : DEFAULT_HINTS
  useEffect(() => {
    hintTimer.current = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length)
    }, 5000)
    return () => {
      if (hintTimer.current) clearInterval(hintTimer.current)
    }
  }, [hints])

  // Typewriter effect for narrative
  useEffect(() => {
    const text = narrativeData?.narrativeText || template?.baseContent || ''
    if (!text) return
    setTypedText('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setTypedText(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 20)
    return () => clearInterval(interval)
  }, [narrativeData, template])

  if (!spot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5">
        <p className="text-ink-dim mb-4">暂无可用密档</p>
        <button
          onClick={() => navigate('/explore')}
          className="h-12 px-8 rounded-full border border-cinnabar text-cinnabar text-base font-medium transition-transform active:scale-[0.96]"
        >
          返回秘辛地图
        </button>
      </div>
    )
  }

  const handleNextSpot = () => {
    if (!spotId) return
    if (narrativeData?.nextSpotId) {
      navigate(`/navigate?spotId=${narrativeData.nextSpotId}`)
    } else {
      navigate('/complete')
    }
  }

  const handleMicStart = () => {
    setIsListening(true)
    setShowReply(false)
    setAiReply('')
    setUserQuestion('')
  }

  const handleMicEnd = async () => {
    setIsListening(false)

    // For MVP: simulate a question if not using real ASR yet
    // TODO: integrate with teammate's ASR module
    const simulatedQuestion = hints[hintIndex] || '这扇窗为何半掩？'
    setUserQuestion(simulatedQuestion)

    const visitorId = getVisitorId()
    if (!visitorId || !spotId) {
      setAiReply('请先登录后再提问。')
      setShowReply(true)
      return
    }

    try {
      const newHistory: VoiceChatMessage[] = [
        ...voiceHistory,
        { role: 'user', content: simulatedQuestion },
      ]

      const res = await fetch('/api/narrative/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          spotId,
          transcript: simulatedQuestion,
          conversationHistory: newHistory.slice(-10),
          interestTag: activeTag,
        }),
      })

      if (!res.ok) throw new Error('Voice chat failed')
      const data = await res.json()

      setAiReply(data.replyText)
      setVoiceHistory([...newHistory, { role: 'assistant', content: data.replyText }])

      if (data.divertHint) {
        // Optional: show soft diversion toast
        console.log('Divert hint:', data.divertHint)
      }
    } catch (e) {
      console.error(e)
      setAiReply('叙叙刚才走神了……你能再问一遍吗？')
    }

    setShowReply(true)
  }

  const displayTitle = narrativeData?.narrativeTitle || template?.title || spot.name

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <TopNav title={spot.shortName} showBack onBack={() => navigate('/explore')} />

      {/* Archive button */}
      <div className="sticky top-14 z-40 flex justify-end px-5 py-2 bg-paper/80 backdrop-blur-md border-b border-scroll-line/30">
        <button
          onClick={() => setShowArchive(true)}
          className="flex items-center gap-1.5 text-[12px] text-gold tracking-[0.04em] px-3 py-1.5 rounded-full border border-gold/30 hover:bg-gold/5 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          密档
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Top: Narrative area ~50% */}
        <div className="flex-1 px-5 pt-4 pb-4 min-h-[45%]">
          <div className={`transition-all duration-500 ease-out ${entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            {/* Main card */}
            <div className="card-elevated rounded-xl overflow-hidden">
              {/* Scroll header decoration */}
              <div className="bg-gradient-to-b from-paper-deep to-paper h-[60px] relative border-b border-gold/20">
                <div className="absolute bottom-3 left-5">
                  <p className="text-[11px] tracking-[0.1em] text-gold/70 font-serif uppercase">
                    {activeTag} 视角
                  </p>
                </div>
              </div>

              <div className="px-5 pt-5 pb-6">
                {/* Spot name */}
                <h2 className="font-display text-[22px] text-ink">{displayTitle}</h2>

                {/* Artifact anchor */}
                {template && (
                  <p className="text-[14px] leading-[1.6] text-ink-dim mt-2">{template.title}</p>
                )}

                {/* AI voice indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <span className="w-0.5 h-3 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-4 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-2.5 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    <span className="w-0.5 h-3.5 bg-cinnabar/60 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                  </div>
                  <span className="text-[12px] text-ink-faint">{isLoading ? 'AI 正在构思叙事…' : 'AI 语音讲解中...'}</span>
                </div>

                {/* Narrative body with typewriter */}
                {isLoading ? (
                  <p className="text-[14px] text-ink-dim mt-4">正在生成专属叙事…</p>
                ) : (
                  <div className="text-[16px] leading-[1.85] text-ink mt-4 min-h-[80px]">
                    {typedText}
                    <span className="inline-block w-0.5 h-4 bg-cinnabar/60 ml-0.5 animate-pulse align-middle" />
                  </div>
                )}

                {/* Flavor text */}
                {template?.flavorText && (
                  <p className="text-center text-[15px] leading-[1.6] text-gold/70 italic font-serif mt-5">
                    &ldquo;{template.flavorText}&rdquo;
                  </p>
                )}

                {/* Next spot hook — from AI narrative data */}
                {narrativeData?.nextSpotName ? (
                  <div className="mt-5 pl-3 border-l-2 border-gold/30">
                    <p className="text-[14px] leading-[1.7] text-ink-dim">
                      下一处秘辛在{narrativeData.nextSpotName}——{narrativeData.destinationHint}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 pl-3 border-l-2 border-gold/30">
                    <p className="text-[14px] leading-[1.7] text-ink-dim">
                      六处秘辛皆已勘验完毕，你的紫禁城密档已收录完整。
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Perspective switcher */}
            {allTemplates.length > 1 && (
              <div className="mt-5">
                <p className="text-[12px] text-ink-faint mb-2.5 tracking-[0.04em]">切换视角</p>
                <div className="flex flex-wrap gap-2">
                  {allTemplates.map((t) => {
                    const isActive = activeTag === t.interestTag
                    return (
                      <button
                        key={t.interestTag}
                        onClick={() => setActiveTag(t.interestTag)}
                        className={`px-3.5 py-2 rounded-full text-[13px] tracking-[0.04em] transition-all duration-200 ${
                          isActive
                            ? 'bg-cinnabar text-white shadow-[0_2px_8px_rgba(163,38,38,0.2)]'
                            : 'bg-paper-deep border border-scroll-line text-ink-dim hover:border-gold/40 hover:text-ink'
                        }`}
                      >
                        {t.interestTag}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI reply area - golden quote box */}
            {showReply && (
              <div className="mt-4 rounded-xl border border-gold/20 bg-gold-dim/30 p-4 animate-ink-bleed">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-1 rounded-full bg-gold" />
                  <span className="text-[11px] text-gold/70 tracking-[0.04em]">你问</span>
                </div>
                <p className="text-[14px] text-ink-dim mb-3">{userQuestion}</p>
                <div className="w-full h-px bg-gold/10 mb-3" />
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] text-gold">AI</span>
                  </div>
                  <p className="text-[14px] text-ink leading-[1.7]">{aiReply}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Thinking feedback area ~20% */}
        <div className="px-5 py-3">
          <div className="text-center">
            {!isListening && !showReply && (
              <p className="text-[13px] text-ink-faint/80 tracking-[0.02em]">
                你可以长按麦克风问我：{hints[0]}
              </p>
            )}
            {isListening && (
              <p className="text-[13px] text-gold animate-pulse tracking-[0.02em]">
                正在聆听您的疑问…
              </p>
            )}
          </div>
        </div>

        {/* Bottom: Voice interaction area ~30% */}
        <div className="px-5 pb-6 pt-2">
          {/* Hint bubble */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="bg-paper-deep border border-scroll-line/60 rounded-2xl px-4 py-2 text-center">
                <p className="text-[12px] text-ink-dim transition-opacity duration-500">{hints[hintIndex]}</p>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-paper-deep border-r border-b border-scroll-line/60 rotate-45" />
            </div>
          </div>

          {/* Mic button with breathing glow */}
          <div className="flex justify-center">
            <button
              onMouseDown={handleMicStart}
              onMouseUp={handleMicEnd}
              onTouchStart={handleMicStart}
              onTouchEnd={handleMicEnd}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
              style={{
                backgroundColor: isListening ? '#A32626' : '#F7F4ED',
                border: `2px solid ${isListening ? '#A32626' : '#D4CFC3'}`,
              }}
            >
              {/* Breathing glow ring */}
              {!isListening && (
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor: 'rgba(184,146,58,0.15)',
                    animationDuration: '2s',
                  }}
                />
              )}
              {/* Ripple effect when listening */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full animate-ping bg-cinnabar/20" style={{ animationDuration: '1s' }} />
                  <div className="absolute -inset-2 rounded-full animate-ping bg-cinnabar/10" style={{ animationDuration: '1.2s' }} />
                </>
              )}

              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isListening ? '#fff' : '#6B6860'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <path d="M12 19v4" />
                <path d="M8 23h8" />
              </svg>
            </button>
          </div>

          <p className="text-center text-[11px] text-ink-faint mt-3 tracking-[0.04em]">
            {isListening ? '松开结束提问' : '长按麦克风提问'}
          </p>

          {/* Bottom CTA */}
          <div className="mt-6 space-y-3">
            <button
              onClick={handleNextSpot}
              className="h-12 w-full rounded-full bg-cinnabar text-[15px] font-medium text-white tracking-[0.04em] transition-all duration-200 ease-out active:scale-[0.96] hover:shadow-[0_4px_20px_rgba(163,38,38,0.25)]"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              去下一个地点
            </button>
          </div>
        </div>
      </div>

      {/* Archive modal */}
      {showArchive && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowArchive(false)}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-full max-w-[360px] bg-paper shadow-2xl flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-scroll-line/50">
              <h3 className="font-display text-[18px] text-ink">秘辛收藏册</h3>
              <button
                onClick={() => setShowArchive(false)}
                className="w-8 h-8 flex items-center justify-center text-ink-dim hover:text-ink"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {getAllSpots().map((s) => {
                const unlocked = isNarrativeUnlocked(s.id)
                const tmpl = NARRATIVE_TEMPLATES.find((t) => t.spotId === s.id && t.interestTag === interestTag)
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (unlocked && s.id !== spotId) {
                        setShowArchive(false)
                        navigate(`/narrative?spotId=${s.id}`)
                      }
                    }}
                    className={`rounded-xl border p-4 ${
                      s.id === spotId
                        ? 'bg-cinnabar-light border-cinnabar shadow-[0_2px_12px_rgba(163,38,38,0.1)]'
                        : unlocked
                          ? 'bg-paper border-gold/20'
                          : 'bg-paper-deep border-scroll-line/30 opacity-60'
                    } ${unlocked && s.id !== spotId ? 'cursor-pointer hover:bg-paper-deep/80 transition-colors' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-display text-[15px] ${
                        s.id === spotId ? 'text-cinnabar' : unlocked ? 'text-ink' : 'text-ink-faint'
                      }`}>
                        {s.name}
                      </span>
                      {s.id === spotId ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cinnabar rotate-[-12deg]">
                          <span className="text-white font-display text-[8px]">勘</span>
                        </span>
                      ) : unlocked ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-cinnabar/50 rotate-[-12deg]">
                          <span className="text-cinnabar font-display text-[8px]">勘</span>
                        </span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-faint">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </div>
                    {unlocked && tmpl ? (
                      <p className={`text-[13px] leading-[1.5] line-clamp-2 ${
                        s.id === spotId ? 'text-cinnabar/70' : 'text-ink-dim'
                      }`}>{tmpl.baseContent}</p>
                    ) : (
                      <p className="text-[12px] text-ink-faint">尚未解锁</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
