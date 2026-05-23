import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { getVisitorId, getInterestTag, isNarrativeUnlocked } from '../utils/storage'
import { SPOTS, getAllSpots } from '../data/spots'
import { getTemplate, getTemplatesBySpot, NARRATIVE_TEMPLATES } from '../data/narratives'
import { getNextRecommendedSpot } from '../utils/route-planner'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useVoicePreference } from '../hooks/useVoicePreference'
import { askQuestion } from '../api/qa'

const DEFAULT_HINTS = [
  '问我关于这里的秘辛...',
  '问我关于建筑的工艺...',
  '问我有关历史的趣闻...',
  '试着问我：这扇窗为何半掩？',
]

export default function Narrative() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const spotId = searchParams.get('spotId')

  const [entered, setEntered] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [userQuestion, setUserQuestion] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [typedText, setTypedText] = useState('')
  const interestTag = getInterestTag()

  // 语音：识别 / 合成 / 偏好
  const sr = useSpeechRecognition('zh-CN')
  const tts = useSpeechSynthesis()
  const voicePref = useVoicePreference()
  const isListening = sr.recording
  const autoPlayedRef = useRef<string | null>(null)

  const hintTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pre-compute spot data before hooks that depend on them
  const spot = spotId ? SPOTS[spotId] : undefined
  const allTemplates = spotId ? getTemplatesBySpot(spotId) : []
  const availableTags = allTemplates.map((t) => t.interestTag)

  // Default to interestTag if available, otherwise first available tag
  const [activeTag, setActiveTag] = useState(() => {
    if (interestTag && availableTags.includes(interestTag)) return interestTag
    return availableTags[0] || ''
  })

  const template = spotId ? getTemplate(spotId, activeTag) : undefined

  useEffect(() => {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [navigate])

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
    if (!template) return
    setTypedText('')
    let i = 0
    const text = template.baseContent
    const interval = setInterval(() => {
      i++
      setTypedText(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, 20)
    return () => clearInterval(interval)
  }, [spotId, activeTag, template])

  useEffect(() => {
    if (!template || !tts.supported) return
    if (typedText !== template.baseContent) return
    if (voicePref.pref === 'off') return
    const key = `${spotId}::${activeTag}`
    if (autoPlayedRef.current === key) return
    autoPlayedRef.current = key
    tts.speak(template.baseContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedText, template?.baseContent, voicePref.pref, tts.supported])

  useEffect(() => {
    tts.cancel()
    autoPlayedRef.current = null
    setShowReply(false)
    setAiReply('')
    setUserQuestion('')
    setIsThinking(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, activeTag])

  useEffect(() => {
    if (!sr.finalText) return
    const question = sr.finalText
    sr.reset()
    void handleAsk(question)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.finalText])

  async function handleAsk(question: string) {
    const visitorId = getVisitorId()
    if (!visitorId) {
      navigate('/')
      return
    }
    tts.cancel()
    setUserQuestion(question)
    setIsThinking(true)
    setShowReply(false)
    try {
      const answer = await askQuestion({
        visitorId,
        currentSpotId: spotId ?? undefined,
        question,
      })
      setAiReply(answer)
      setShowReply(true)
      if (tts.supported && answer) tts.speak(answer)
    } catch {
      setAiReply('网络暂时中断，请稍后再问。')
      setShowReply(true)
    } finally {
      setIsThinking(false)
    }
  }

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
    const nextSpotId = getNextRecommendedSpot(spotId)
    if (nextSpotId) {
      navigate(`/navigate?spotId=${nextSpotId}`)
    } else {
      navigate('/complete')
    }
  }

  const handleMicToggle = () => {
    if (!sr.supported || isThinking) return
    if (isListening) {
      sr.stop()
      return
    }
    setShowReply(false)
    setAiReply('')
    setUserQuestion('')
    setIsThinking(false)
    sr.start()
  }

  /** 用户点击 AI 语音条切换朗读 / 暂停 / 继续，并把偏好写入持久化 */
  const handleToggleTts = () => {
    if (!tts.supported || !template) return
    if (tts.speaking && !tts.paused) {
      tts.pause()
      voicePref.set('off')
      return
    }
    if (tts.paused) {
      tts.resume()
      voicePref.set('on')
      return
    }
    // idle：从头读一次剧情
    voicePref.set('on')
    tts.speak(showReply && aiReply ? aiReply : template.baseContent)
  }

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
                <h2 className="font-display text-[22px] text-ink">{spot.name}</h2>

                {/* Artifact anchor */}
                {template && (
                  <p className="text-[14px] leading-[1.6] text-ink-dim mt-2">{template.title}</p>
                )}

                {/* AI voice indicator: 真朗读 / 暂停 / 继续 */}
                {tts.supported && (
                  <button
                    type="button"
                    onClick={handleToggleTts}
                    className="mt-4 flex items-center gap-2 px-2 py-1 -ml-2 rounded-full text-left transition-colors hover:bg-paper-deep/60"
                    aria-label={tts.speaking ? '暂停朗读' : '朗读剧情'}
                  >
                    <div className="flex items-center gap-0.5">
                      <span
                        className={`w-0.5 h-3 rounded-full bg-cinnabar/60 ${tts.speaking && !tts.paused ? 'animate-pulse' : 'opacity-40'}`}
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className={`w-0.5 h-4 rounded-full bg-cinnabar/60 ${tts.speaking && !tts.paused ? 'animate-pulse' : 'opacity-40'}`}
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className={`w-0.5 h-2.5 rounded-full bg-cinnabar/60 ${tts.speaking && !tts.paused ? 'animate-pulse' : 'opacity-40'}`}
                        style={{ animationDelay: '300ms' }}
                      />
                      <span
                        className={`w-0.5 h-3.5 rounded-full bg-cinnabar/60 ${tts.speaking && !tts.paused ? 'animate-pulse' : 'opacity-40'}`}
                        style={{ animationDelay: '450ms' }}
                      />
                    </div>
                    <span className="text-[12px] text-ink-faint">
                      {tts.speaking && !tts.paused
                        ? 'AI 语音讲解中 · 点此暂停'
                        : tts.paused
                          ? '已暂停 · 点此继续'
                          : '点此朗读剧情'}
                    </span>
                  </button>
                )}

                {/* Narrative body with typewriter */}
                {template ? (
                  <div className="text-[16px] leading-[1.85] text-ink mt-4 min-h-[80px]">
                    {typedText}
                    <span className="inline-block w-0.5 h-4 bg-cinnabar/60 ml-0.5 animate-pulse align-middle" />
                  </div>
                ) : (
                  <p className="text-[14px] text-ink-dim mt-4">暂无该视角的叙事内容</p>
                )}

                {/* Flavor text */}
                {template?.flavorText && (
                  <p className="text-center text-[15px] leading-[1.6] text-gold/70 italic font-serif mt-5">
                    &ldquo;{template.flavorText}&rdquo;
                  </p>
                )}

                {/* Next spot hook — narrative continuation */}
                {template?.nextHook && (
                  <div className="mt-5 pl-3 border-l-2 border-gold/30">
                    <p className="text-[14px] leading-[1.7] text-ink-dim">{template.nextHook}</p>
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
            {!isListening && !sr.transcribing && !showReply && !isThinking && !sr.errorCode && (
              <p className="text-[13px] text-ink-faint/80 tracking-[0.02em]">
                {sr.supported
                  ? `你可以点击麦克风问我：${hints[0]}`
                  : '当前浏览器不支持麦克风录音，请改用支持 MediaRecorder 的浏览器'}
              </p>
            )}
            {sr.errorCode && !isListening && !sr.transcribing && !isThinking && (
              <p className="text-[13px] text-cinnabar/90 tracking-[0.02em] px-4">
                {sr.errorCode === 'not-allowed'
                  ? '麦克风权限被拒。请在 Chrome 地址栏左侧 🔒 图标里把麦克风改为「允许」，并确认 macOS 系统设置 → 隐私与安全 → 麦克风 中已勾选 Chrome'
                  : sr.errorCode === 'no-mic'
                    ? '没有检测到可用的麦克风设备'
                    : sr.errorCode === 'no-speech'
                      ? '没有识别到内容，请靠近麦克风再说一次'
                      : sr.errorCode === 'asr-failed'
                        ? '语音识别服务暂时不可用，请稍后重试'
                        : sr.errorCode === 'recorder-failed' || sr.errorCode === 'mic-failed'
                          ? '录音失败，请刷新页面重试'
                          : `语音识别异常：${sr.errorCode}（按 F12 查看控制台）`}
              </p>
            )}
            {isListening && (
              <p className="text-[13px] text-gold animate-pulse tracking-[0.02em]">
                正在聆听您的疑问…（再点一次麦克风结束）
              </p>
            )}
            {sr.transcribing && (
              <p className="text-[13px] text-gold/80 tracking-[0.02em] animate-pulse">
                正在识别您说的话…
              </p>
            )}
            {isThinking && (
              <p className="text-[13px] text-cinnabar/80 tracking-[0.02em] animate-pulse">
                正在为您查阅资料…
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
              disabled={!sr.supported || isThinking || sr.transcribing}
              onClick={handleMicToggle}
              aria-label={
                !sr.supported
                  ? '当前浏览器不支持语音识别'
                  : isListening
                    ? '点击停止录音'
                    : '点击开始提问'
              }
              aria-pressed={isListening}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
            {!sr.supported
              ? '当前浏览器不支持语音识别'
              : isListening
                ? '再点一次结束提问'
                : sr.transcribing
                  ? '正在识别…'
                  : isThinking
                    ? '正在思考…'
                    : '点击麦克风开始提问'}
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
                      unlocked ? 'bg-paper border-gold/20' : 'bg-paper-deep border-scroll-line/30 opacity-60'
                    } ${unlocked && s.id !== spotId ? 'cursor-pointer hover:bg-paper-deep/80 transition-colors' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-display text-[15px] ${unlocked ? 'text-ink' : 'text-ink-faint'}`}>
                        {s.name}
                      </span>
                      {unlocked ? (
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
                      <p className="text-[13px] text-ink-dim leading-[1.5] line-clamp-2">{tmpl.baseContent}</p>
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
