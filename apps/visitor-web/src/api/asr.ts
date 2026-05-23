/**
 * 上传一段录音，返回识别后的文本。
 *
 * 后端 POST /api/asr/transcribe，multipart/form-data：
 *   - audio: 录音 Blob（webm/mp4 都行，后端用 ffmpeg 转 16k PCM）
 *   - visitorId: 可选，便于审计
 */
export async function transcribeAudio(
  audio: Blob,
  visitorId?: string,
): Promise<{ text: string; warning?: string }> {
  const fd = new FormData()
  // 文件名后缀仅是提示，真正格式由 ffmpeg 嗅探，所以用 webm 兜底
  const filename = audio.type.includes('mp4') ? 'speech.mp4' : 'speech.webm'
  fd.append('audio', audio, filename)
  if (visitorId) fd.append('visitorId', visitorId)

  const res = await fetch('/api/asr/transcribe', {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string
      error?: string
    }
    throw new Error(body.message || body.error || `ASR HTTP ${res.status}`)
  }
  const data = (await res.json()) as { text: string; warning?: string }
  return data
}
