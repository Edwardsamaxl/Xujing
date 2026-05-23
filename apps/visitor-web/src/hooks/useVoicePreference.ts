import { useCallback, useEffect, useState } from 'react'

/**
 * 语音导览开关偏好的持久化。
 *
 * 状态：
 * - null: 用户尚未做选择 → 首次进入应弹出 banner 询问
 * - 'on': 已开启，剧情自动 TTS
 * - 'off': 已关闭，仅手动点「朗读」按钮才念
 */

export type VoicePref = 'on' | 'off' | null

const KEY = 'xujing_voice_guide_pref'

export function useVoicePreference() {
  const [pref, setPref] = useState<VoicePref>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY)
      if (v === 'on' || v === 'off') setPref(v)
    } catch {
      /* localStorage 不可用 */
    }
    setHydrated(true)
  }, [])

  const set = useCallback((v: 'on' | 'off') => {
    try {
      localStorage.setItem(KEY, v)
    } catch {
      /* noop */
    }
    setPref(v)
  }, [])

  return { pref, set, hydrated }
}
