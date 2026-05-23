import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 浏览器原生 speechSynthesis 的 React 封装。
 *
 * - speak(text) 会先 cancel() 上一段，避免叠加播放。
 * - 暴露 speaking / paused 用于 UI 显示「朗读中 / 已暂停 / 空闲」。
 * - 组件卸载时自动 cancel，防止页面切换后还在念。
 */

const isBrowser = typeof window !== 'undefined' && 'speechSynthesis' in window

export interface SpeakOptions {
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface SpeechSynthesisState {
  supported: boolean
  speaking: boolean
  paused: boolean
  speak: (text: string, opts?: SpeakOptions) => void
  pause: () => void
  resume: () => void
  cancel: () => void
}

export function useSpeechSynthesis(): SpeechSynthesisState {
  const supported = isBrowser
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(
    (text: string, opts: SpeakOptions = {}) => {
      if (!supported || !text) return
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* noop */
      }
      const u = new SpeechSynthesisUtterance(text)
      u.lang = opts.lang ?? 'zh-CN'
      u.rate = opts.rate ?? 0.95
      u.pitch = opts.pitch ?? 1
      if (opts.volume !== undefined) u.volume = opts.volume
      u.onstart = () => {
        setSpeaking(true)
        setPaused(false)
      }
      u.onend = () => {
        setSpeaking(false)
        setPaused(false)
      }
      u.onerror = () => {
        setSpeaking(false)
        setPaused(false)
      }
      u.onpause = () => setPaused(true)
      u.onresume = () => setPaused(false)
      utterRef.current = u
      window.speechSynthesis.speak(u)
    },
    [supported],
  )

  const pause = useCallback(() => {
    if (!supported) return
    try {
      window.speechSynthesis.pause()
      setPaused(true)
    } catch {
      /* noop */
    }
  }, [supported])

  const resume = useCallback(() => {
    if (!supported) return
    try {
      window.speechSynthesis.resume()
      setPaused(false)
    } catch {
      /* noop */
    }
  }, [supported])

  const cancel = useCallback(() => {
    if (!supported) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      /* noop */
    }
    setSpeaking(false)
    setPaused(false)
  }, [supported])

  // 卸载时清理：避免离开页面后还在念
  useEffect(() => {
    return () => {
      if (!supported) return
      try {
        window.speechSynthesis.cancel()
      } catch {
        /* noop */
      }
    }
  }, [supported])

  return { supported, speaking, paused, speak, pause, resume, cancel }
}
