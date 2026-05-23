/**
 * 百度短语音识别极速版（pro_api）封装。
 *
 * 免费额度 5 万次/天，单条音频最长 60s。
 * 文档：https://ai.baidu.com/ai-doc/SPEECH/Jlbxdezuf
 *
 * 所需环境变量：
 *   - BAIDU_ASR_API_KEY    （百度智能云"应用列表"中的 API Key）
 *   - BAIDU_ASR_SECRET_KEY （同一应用的 Secret Key）
 */

const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token'
const ASR_URL = 'https://vop.baidu.com/pro_api'

interface CachedToken {
  token: string
  expiresAt: number // ms
}

// access_token 默认 30 天有效，进程内缓存即可
let cached: CachedToken | null = null

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.BAIDU_ASR_API_KEY
  const secretKey = process.env.BAIDU_ASR_SECRET_KEY
  if (!apiKey || !secretKey) {
    throw new Error('BAIDU_ASR_API_KEY / BAIDU_ASR_SECRET_KEY 未配置')
  }
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.token
  }

  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Baidu token endpoint ${res.status}`)
  }
  const data = (await res.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
    error_description?: string
  }
  if (!data.access_token) {
    throw new Error(
      `Baidu token error: ${data.error || ''} ${data.error_description || ''}`.trim(),
    )
  }
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 2_592_000) * 1000,
  }
  return cached.token
}

export interface BaiduAsrResult {
  text: string
  raw: unknown
}

/**
 * 调用百度极速版 ASR 识别一段 PCM。
 *
 * @param pcm 16k 采样、单声道、16bit、小端 PCM 原始字节流
 * @param cuid 可任意字符串，建议传 visitorId 便于百度后台审计
 */
export async function transcribePcm(
  pcm: Buffer,
  cuid: string,
): Promise<BaiduAsrResult> {
  const token = await getAccessToken()
  // dev_pid=80001 = 极速版普通话输入法模型，对短问答场景效果最好
  const params = new URLSearchParams({
    dev_pid: '80001',
    cuid,
    token,
  })
  const res = await fetch(`${ASR_URL}?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/pcm;rate=16000',
      'Content-Length': String(pcm.length),
    },
    body: pcm,
  })
  if (!res.ok) {
    throw new Error(`Baidu ASR HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    err_no?: number
    err_msg?: string
    result?: string[]
  }
  if (data.err_no !== 0) {
    throw new Error(`Baidu ASR err_no=${data.err_no} ${data.err_msg ?? ''}`)
  }
  const text = (data.result?.[0] ?? '').trim()
  return { text, raw: data }
}
