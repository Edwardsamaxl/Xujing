# 叙境 Server

Node + Express + TypeScript + Prisma + Postgres，对外暴露剧情、打卡、勘验数据、语音问答与百度 ASR 等接口。

---

## 快速开始

```bash
# 1. 安装依赖（在仓库根目录跑，npm workspace 会一起装 server / visitor-web）
cd <repo-root> && npm install

# 2. 准备环境变量
cd server
cp .env.example .env
# 然后编辑 .env 填入真实 Key（详见下面"环境变量"一节）

# 3. 数据库初始化（首次或 schema 有变更时）
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 4. 启动开发服务（默认 http://localhost:3000）
npm run dev
```

启动成功的关键日志：

```
[asr] ffmpeg binary = /opt/homebrew/bin/ffmpeg     ← 这一行决定能不能转码
Server running on port 3000
```

---

## 环境变量

完整模板见 [`.env.example`](./.env.example)，下面是要点：

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres 连接串 |
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek 控制台 → API Keys。剧情生成 + 语音问答都依赖它 |
| `DEEPSEEK_BASE_URL` | ❌ | 默认 `https://api.deepseek.com`，特殊网络可换网关 |
| `BAIDU_ASR_API_KEY` | ✅ | 百度智能云 → 语音技术 → 应用列表里的 **API Key**（不是 AppID） |
| `BAIDU_ASR_SECRET_KEY` | ✅ | 同上应用里的 **Secret Key** |
| `FFMPEG_PATH` | ❌* | ffmpeg 绝对路径。详见下一节 |
| `PORT` | ❌ | 默认 3000 |

> *`FFMPEG_PATH` 不是真的可选——它有回退逻辑，但国内环境下回退也容易失败，强烈建议显式配置。

申请 Key 步骤：

- **DeepSeek**：<https://platform.deepseek.com/api_keys>，注意账户要有余额，否则会返回 402。
- **百度 ASR**：<https://console.bce.baidu.com/ai/#/ai/speech/overview/index>，创建"语音技术"应用，从应用详情拿 API Key / Secret Key。免费额度足够开发期使用。

---

## ffmpeg 配置（重要）

`/api/asr/transcribe` 拿到浏览器上传的 webm/m4a 后，必须用 ffmpeg 转成 16k 单声道 PCM 才能扔给百度 ASR。代码里查找 ffmpeg 的顺序是：

1. `process.env.FFMPEG_PATH`
2. PATH 中的 `ffmpeg`（`command -v ffmpeg`）
3. `ffmpeg-static` 自带的二进制

### 国内开发常见坑

- **坑 1：`ffmpeg-static` postinstall 下载失败。** 它要从 GitHub Releases 拉二进制，国内网络经常超时或断流。表现：`npm install` 时报 `404`/`ETIMEDOUT`，或装完后 `node_modules/ffmpeg-static/ffmpeg` 是 0 字节。
- **坑 2：macOS Gatekeeper 把它当未签名二进制拦了。** 即使下载成功，第一次执行会报 `EACCES` 或 `Unknown system error -88`。

### 推荐做法：手动装系统 ffmpeg

```bash
# macOS
brew install ffmpeg
which ffmpeg                  # 例：/opt/homebrew/bin/ffmpeg

# Ubuntu / Debian
sudo apt install ffmpeg
which ffmpeg                  # 例：/usr/bin/ffmpeg
```

然后把绝对路径写进 `server/.env`：

```env
FFMPEG_PATH="/opt/homebrew/bin/ffmpeg"
```

重启 `npm run dev`，看到 `[asr] ffmpeg binary = /opt/homebrew/bin/ffmpeg` 即配好。

---

## 常见错误与排查

### 叙述页报"服务暂时不可用"

ASR 接口返回 5xx。按这个顺序查：

```bash
# 1. 后端日志里有没有这一行
[asr] ffmpeg binary = ...

# 2. 测一下 ffmpeg 能跑
$FFMPEG_PATH -version    # 或 ffmpeg -version

# 3. 检查百度 Key 是否填了
grep BAIDU server/.env
```

最常见的根因（按出现频率）：

1. `BAIDU_ASR_API_KEY` / `SECRET_KEY` 没填或填错（去百度控制台对一遍 API Key vs Secret Key，别填成 AppID）。
2. ffmpeg 没装 / `FFMPEG_PATH` 没配 → 转码就失败。
3. 服务端 `.env` 改完没重启 `npm run dev`（`tsx watch` 不会自动重载 `.env`，得手动重启）。

### 语音问答返回"账户余额不足"

DeepSeek 返回 402，去 <https://platform.deepseek.com> 充值，或换一个有余额的 Key。

### `Visitor not found`

前端 `localStorage` 里存了一个不存在的 visitor id（比如换了数据库后没清缓存）。在浏览器控制台跑：

```js
localStorage.clear(); location.reload()
```

### Prisma 报字段不存在

同事更新了 schema 但没跑 migrate。补上：

```bash
cd server
npx prisma migrate deploy
npx prisma generate
npx tsx prisma/seed.ts     # 如果 seed 也有更新
```

---

## 测试

```bash
cd server
npm test                  # 跑一遍所有 vitest
```

主要覆盖：visitor 会话创建、签到、奖励发放、剧情生成 prompt 拼装、check-in 闸门规则等。ASR / 语音问答因为依赖外部 API，目前没有单元测试，靠端到端手动验证。
