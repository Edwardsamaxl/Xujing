import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 浏览器原生 Web Speech API 的 React 封装。
 *
 * - 支持检测：`supported` 为 false 时调用方应回退到文字输入。
 * - 流式中间结果：`transcript` 实时更新。
 * - 最终结果：`finalText` 仅在用户停止说话后才赋值。
 *
 * 兼容 webkitSpeechRecognition（Safari/Chrome）。
 */

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: unknown) => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export interface SpeechRecognitionState {
  supported: boolean
  recording: boolean
  /** 实时识别中的文本（含 interim） */
  transcript: string
  /** 最终识别结果（用户停止说话后） */
  finalText: string
  start: () => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(lang = 'zh-CN'): SpeechRecognitionState {
  const Ctor = getCtor()
  const supported = !!Ctor
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalText, setFinalText] = useState('')
  const recRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    if (!Ctor) return
    const rec = new Ctor()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = lang
    rec.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) final += r[0].transcript
        else interim += r[0].transcript
      }
      if (final) setFinalText(final.trim())
      setTranscript((final || interim).trim())
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    recRef.current = rec
    return () => {
      try {
        rec.stop()
      } catch {
        /* noop */
      }
      recRef.current = null
    }
  }, [Ctor, lang])

  const start = useCallback(() => {
    const rec = recRef.current
    if (!rec || recording) return
    setTranscript('')
    setFinalText('')
    try {
      rec.start()
      setRecording(true)
    } catch {
      /* 用户可能在已 start 的状态下又点了一次 */
    }
  }, [recording])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* noop */
    }
    setRecording(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setFinalText('')
  }, [])

  return { supported, recording, transcript, finalText, start, stop, reset }
}
