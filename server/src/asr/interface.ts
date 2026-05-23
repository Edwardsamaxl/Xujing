import { Router } from 'express'
import multer from 'multer'
import ffmpegStaticPath from 'ffmpeg-static'
import { execSync, spawn } from 'node:child_process'
import { transcribePcm } from './baidu'

/**
 * 解析可用的 ffmpeg 二进制路径。
 *
 * 优先顺序：
 *   1. 环境变量 FFMPEG_PATH（部署可覆盖）
 *   2. 系统 PATH 上的 ffmpeg（macOS brew、Linux apt 等，已签名/已授权）
 *   3. ffmpeg-static 包内置二进制（兜底，部分系统会被 Gatekeeper 拦截）
 */
function resolveFfmpegPath(): string {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH
  try {
    return execSync('command -v ffmpeg', { encoding: 'utf8' }).trim() || ''
  } catch {
    // 系统 PATH 没有
  }
  return (ffmpegStaticPath as unknown as string) || 'ffmpeg'
}

const FFMPEG_BIN = resolveFfmpegPath()
console.log('[asr] ffmpeg binary =', FFMPEG_BIN)

const router = Router()

// 浏览器 MediaRecorder 默认输出 webm/opus，10s 大约 30-50KB；
// 这里限制 10MB（约 30 分钟音频），防御性截断。
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

/**
 * 用 ffmpeg 把任意容器（webm/mp4/m4a 等）的音频转成 16k 单声道 16bit 小端 PCM。
 * 全程 stdin/stdout 流式，无需写临时文件。
 */
function toPcm16kMono(input: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-f',
      's16le',
      'pipe:1',
    ])

    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []

    proc.stdout.on('data', (c: Buffer) => chunks.push(c))
    proc.stderr.on('data', (c: Buffer) => errChunks.push(c))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(chunks))
      } else {
        reject(
          new Error(
            `ffmpeg exit ${code}: ${Buffer.concat(errChunks).toString().slice(-500)}`,
          ),
        )
      }
    })

    proc.stdin.end(input)
  })
}

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  const file = req.file
  const cuid =
    typeof req.body?.visitorId === 'string' && req.body.visitorId
      ? req.body.visitorId
      : 'anonymous'

  if (!file || file.size === 0) {
    res.status(400).json({ error: 'audio file required' })
    return
  }

  try {
    const pcm = await toPcm16kMono(file.buffer)
    if (pcm.length < 16_000) {
      // 不足 0.5 秒（每秒 32KB PCM，0.5s = 16KB），多半是误触
      res.json({ text: '' })
      return
    }
    const { text } = await transcribePcm(pcm, cuid)
    res.json({ text })
  } catch (e) {
    console.error('[asr/transcribe]', e)
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('未配置')) {
      res
        .status(503)
        .json({ error: 'ASR not configured', message: '后端 .env 未配置百度 ASR 密钥' })
      return
    }
    if (msg.includes('err_no=3301') || msg.includes('err_no=3300')) {
      // 3300/3301 = 音频质量差，常见于环境过吵或时长不足
      res.json({ text: '', warning: 'audio_unrecognized' })
      return
    }
    res.status(500).json({ error: 'transcribe failed', message: msg })
  }
})

export default router
