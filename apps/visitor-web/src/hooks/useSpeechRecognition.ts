import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../api/asr'
import { getVisitorId } from '../utils/storage'

/**
 * 语音输入 Hook —— 基于 MediaRecorder + 后端 ASR API。
 *
 * 历史背景：早期版本使用 webkitSpeechRecognition 走 Google 云识别，
 * 但在国内不可用。现已改为浏览器录音 → 上传 → 后端百度 ASR → 返回文字。
 *
 * 交互：toggle —— 用户点一次 start，再点一次 stop。
 *
 * - `supported` 为 false 时调用方应回退到文字输入（getUserMedia/MediaRecorder 缺失）
 * - `recording` 录音中
 * - `transcribing` 已停止录音、正在调后端 ASR（1-3s 延迟）
 * - `transcript` 实时字幕；当前实现不流式，录音中保持空字符串
 * - `finalText` ASR 返回的最终文本（仅 stop 后填充一次）
 * - `errorCode` 最近一次错误码（'not-allowed' / 'no-mic' / 'asr-failed' / 'no-speech'）
 */

export interface SpeechRecognitionState {
  supported: boolean
  recording: boolean
  transcribing: boolean
  transcript: string
  finalText: string
  errorCode: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
  ]
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

export function useSpeechRecognition(_lang = 'zh-CN'): SpeechRecognitionState {
  const supported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalText, setFinalText] = useState('')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeRef = useRef<string>('')

  // 卸载时确保关闭 mic
  useEffect(() => {
    return () => {
      try {
        mediaRef.current?.stop()
      } catch {
        /* noop */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      mediaRef.current = null
      streamRef.current = null
    }
  }, [])

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRef.current = null
  }

  const start = useCallback(async () => {
    if (!supported || recording || transcribing) return
    setErrorCode(null)
    setTranscript('')
    setFinalText('')
    chunksRef.current = []

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[asr] getUserMedia failed:', err)
      const name = (err as { name?: string })?.name || ''
      setErrorCode(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'not-allowed'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
            ? 'no-mic'
            : 'mic-failed',
      )
      return
    }

    const mime = pickMime()
    mimeRef.current = mime
    let recorder: MediaRecorder
    try {
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[asr] MediaRecorder ctor failed:', err)
      stream.getTracks().forEach((t) => t.stop())
      setErrorCode('recorder-failed')
      return
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onerror = (e) => {
      // eslint-disable-next-line no-console
      console.error('[asr] recorder error:', e)
      setErrorCode('recorder-failed')
    }
    recorder.onstop = async () => {
      cleanupStream()
      const blob = new Blob(chunksRef.current, {
        type: mimeRef.current || 'audio/webm',
      })
      chunksRef.current = []
      if (blob.size < 1024) {
        // 几乎没声音，避免空跑
        setTranscribing(false)
        setErrorCode('no-speech')
        return
      }
      setTranscribing(true)
      try {
        const visitorId = getVisitorId() || undefined
        const { text, warning } = await transcribeAudio(blob, visitorId)
        if (warning === 'audio_unrecognized' || !text) {
          setErrorCode('no-speech')
        } else {
          setFinalText(text)
          setTranscript(text)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[asr] transcribe failed:', err)
        setErrorCode('asr-failed')
      } finally {
        setTranscribing(false)
      }
    }

    streamRef.current = stream
    mediaRef.current = recorder
    try {
      recorder.start()
      setRecording(true)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[asr] recorder.start threw:', err)
      cleanupStream()
      setErrorCode('recorder-failed')
    }
  }, [supported, recording, transcribing])

  const stop = useCallback(() => {
    if (!recording) return
    setRecording(false)
    try {
      mediaRef.current?.stop()
    } catch {
      /* noop */
    }
  }, [recording])

  const reset = useCallback(() => {
    setTranscript('')
    setFinalText('')
    setErrorCode(null)
  }, [])

  return {
    supported,
    recording,
    transcribing,
    transcript,
    finalText,
    errorCode,
    start,
    stop,
    reset,
  }
}
