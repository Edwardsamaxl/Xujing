# 叙境项目 vs PRD 对齐 — 执行清单（供其他 agent 直接修改）

> 本文件记录所有已确认的对齐决策，包含精确的代码修改点，其他 agent 可直接按此执行。

---

## 一、P0 阻塞性修改（必须先做，否则编译/运行失败）

### 1.1 解决 Narrative.tsx 合并冲突

**文件**：`apps/visitor-web/src/pages/Narrative.tsx`

**冲突位置**：全文有 3 处 `<<<<<<< HEAD` / `=======` / `>>>>>>> origin/feat/voice-qa-and-tts`

**处理方式**：
- 保留 `origin/feat/voice-qa-and-tts` 分支的代码
- 删除所有 `<<<<<<< HEAD`、`=======`、`>>>>>>> origin/feat/voice-qa-and-tts` 标记行
- 删除 HEAD 块的旧版 `handleMicEnd` 模拟提问逻辑

**保留后的关键代码结构**：

```typescript
// 第 1 处冲突（import 区域）
import { getTemplatesBySpot, NARRATIVE_TEMPLATES } from '../data/narratives'
import { getNextRecommendedSpot } from '../utils/route-planner'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useVoicePreference } from '../hooks/useVoicePreference'
import { askQuestion } from '../api/qa'

// 第 2 处冲突（语音 hook 初始化，约第 54-63 行）
const sr = useSpeechRecognition('zh-CN')
const tts = useSpeechSynthesis()
const voicePref = useVoicePreference()
const isListening = sr.recording
const autoPlayedRef = useRef<string | null>(null)

// 第 3 处冲突（TTS toggle 按钮区域，约第 299-315 行）
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
```

**注意**：保留后需确保没有残留的 `isListening` 变量引用（HEAD 块定义的局部状态），voice-qa-and-tts 分支使用的是 `sr.recording`。

---

### 1.2 解决 server/src/narrative/engine.ts 合并冲突

**文件**：`server/src/narrative/engine.ts`

**冲突位置**：全文有 2 处合并冲突标记

**处理方式**：
- 保留 `origin/feat/voice-qa-and-tts` 分支的代码
- 删除所有冲突标记
- **关键**：voice-qa-and-tts 分支已经通过 `import { callDeepSeek } from '../llm/deepseek'` 引入 `callDeepSeek`，因此需要**删除** HEAD 块中内嵌定义的 `callDeepSeek` 函数（约第 145-172 行）
- 确保 `generateTask` 函数完整闭合，尾部没有被截断

**保留后的代码结构要点**：

```typescript
import { callDeepSeek } from '../llm/deepseek'  // 确认这行 import 存在

// generateTask 函数中保留 try/catch 结构：
let narrativeText: string
try {
  const prompt = buildThreeStepPrompt({...})
  narrativeText = await callDeepSeek(prompt)
  if (narrativeText.length < 50 || narrativeText.length > 400) {
    throw new Error('LLM output length invalid')
  }
} catch (e) {
  console.error('LLM generation failed, using fallback:', e)
  narrativeText = generateFallbackNarrative({...})
}

// 保留 generateFallbackNarrative 函数
// 保留 generateSpotNarrative 函数
// 删除内嵌的 async function callDeepSeek(prompt) {...} 定义
```

---

## 二、P0 功能对齐修改（影响产品体验）

### 2.1 Navigate 页面 — 移除"附近"提示

**文件**：`apps/visitor-web/src/pages/Navigate.tsx`

**删除内容**（约第 289-294 行）：

```tsx
{/* 删除整个 nearby hint 块 */}
{route.isNearby && (
  <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
    <p className="text-[13px] text-emerald-700 text-center">
      你似乎已在此地附近
    </p>
  </div>
)}
```

**不需要修改 `route-planner.ts` 中的 `isNearby` 计算逻辑**（虽然它不再被使用，但保留无妨，不报错即可）。

---

### 2.2 QA Prompt — 字数限制改为 80

**文件**：`server/src/qa/prompt.ts`

**修改位置**：第 39 行

```diff
-       '4. 答案不超过 100 字，因为游客是边走边听。',
+       '4. 答案不超过 80 字，因为游客是边走边听。',
```

---

### 2.3 拥堵状态 — 前后端对齐为静态常量

**文件**：`apps/visitor-web/src/data/spots.ts`

**替换 `getCrowdLevel()` 函数**（约第 254-261 行）：

```diff
- export function getCrowdLevel(spotId: string): 'smooth' | 'moderate' | 'crowded' {
-   const hour = new Date().getHours()
-   const hash = spotId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
-   const seed = (hash + hour) % 3
-   if (seed === 0) return 'smooth'
-   if (seed === 1) return 'moderate'
-   return 'crowded'
- }
+ /** MVP 阶段静态配置，与后端 seed.ts 对齐 */
+ const CROWD_CONFIG: Record<string, 'smooth' | 'moderate' | 'crowded'> = {
+   'spot-clock':    'crowded',   // 钟表馆：热门，常拥挤
+   'spot-treasure': 'crowded',   // 珍宝馆：热门，常拥挤
+   'spot-ceramic':  'moderate',  // 陶瓷馆：中等人流
+   'spot-yanxi':    'smooth',    // 延禧宫：冷门，需引流
+   'spot-shoukang': 'smooth',    // 寿康宫：冷门，需引流
+   'spot-cining':   'smooth',    // 慈宁宫：冷门，需引流
+ }
+
+ export function getCrowdLevel(spotId: string): 'smooth' | 'moderate' | 'crowded' {
+   return CROWD_CONFIG[spotId] ?? 'smooth'
+ }
```

**验证**：确认后端 `server/prisma/seed.ts` 中对应 spot 的 `status` 字段：
- `spot-clock`: status='targeted'（前端显示 crowded，表示需要从此处分流）
- `spot-treasure`: status='targeted'
- `spot-ceramic`: status='normal'
- `spot-yanxi`: status='targeted'
- `spot-shoukang`: status='normal'
- `spot-cining`: status='normal'

**注意**：前端 `getCrowdLevel` 返回的是游客可见的文案标签（smooth/moderate/crowded），后端 `status` 是运营配置标签（normal/crowded/paused/targeted）。两者的映射关系不需要严格一一对应，只要语义一致即可：
- 后端 `crowded` → 前端 `crowded`
- 后端 `normal` → 前端 `moderate`
- 后端 `targeted` → 前端 `smooth`（表示冷门、需要引流）

---

## 三、P1 体验优化

### 3.1 Explore 弱推荐文案 — 剧情化

**文件**：`apps/visitor-web/src/pages/Explore.tsx`

**修改位置**：约第 180-187 行，弱推荐提示区域

**当前文案**：
```tsx
<p className="text-[12px] text-ink-dim">
  轻量提示：<span className="text-ink font-medium">{SPOTS[recommended]?.name}</span> 当前人流较少，可优先前往
</p>
```

**目标**：改为剧情化钩子文案。由于文案需要结合当前点位和推荐点位，建议调用后端 API 获取（见 `docs/diff-routing-algorithm.md`）。

**MVP 临时方案**（如果后端 API 尚未实现）：在前端硬编码一个 `RECOMMEND_FLAVOR` 映射表：

```typescript
const RECOMMEND_FLAVOR: Record<string, string> = {
  'spot-yanxi': '写字人钟底座的纹路与延禧宫当年水殿遗存的铸铁构件，都指向清末中西工法的交融。此刻延禧宫人流较少，去那里，残图能揭开这段中西合璧的工法秘密。',
  'spot-shoukang': '钟表记录的是线性时间的精确刻度，而寿康宫里的崇庆皇太后活了八十六年，她度过的是紫禁城中最漫长、最缓慢的岁月。此刻寿康宫人少，去听听另一种对时间的理解。',
  'spot-cining': '西洋机械的精确传入中国时，最先震撼的不是工匠，而是权力中枢。此刻慈宁宫安静，去那里看看清初权力博弈的答案。',
}
```

在 Explore.tsx 中使用：
```tsx
<p className="text-[12px] text-ink-dim">
  {RECOMMEND_FLAVOR[recommended] || `${SPOTS[recommended]?.name} 当前人流较少，可优先前往`}
</p>
```

---

## 四、PRD 需要同步修改的条目

**文件**：`docs/叙境_PRD_v0.1.md`

### 4.1 §9.1 Step 4 — 奖励弹卡交互

**原文**：
> 弹出奖励小卡片（故宫专属插画/徽章），停留 2-3 秒后自动收起；随后自动进入 Narrative 页面

**改为**：
> 弹出奖励小卡片（故宫专属插画/徽章），游客点击"收好勋章"后进入 Narrative 页面。

### 4.2 §7.1 运营复盘

**原文**：
> 后台输出基础运营复盘：扫码、兴趣、路线、任务、反馈关键词

**改为**：
> MVP 阶段运营复盘仅作展示，不接数据库。技术侧可通过日志或手动查询获取基础数据。

### 4.3 §9.1 Step 4 — GPS 附近提示

**原文**：
> 若游客已在目标地点附近（如 GPS 距离 < 100m 或处于该殿宇地理围栏内），页面提示"你似乎已在此地附近"，`[我已到达]`按钮直接可用

**改为**：
> MVP 阶段暂不接入 GPS 定位，移除附近提示，统一由游客手动点击"我已到达"完成打卡。

### 4.4 §12.6 — QA 字数

**原文**：
> 回复字数控制在 80 字以内

**确认保持 80 字不变**（代码已对齐）。

---

## 五、不需要修改的部分（已确认 OK）

| 项目 | 状态 |
|---|---|
| 36 组语料库 | ✅ 前后端完整 |
| 6 张 medal 图片 | ✅ 已存在 |
| 9 条 SpotConnection 导流关联 | ✅ 已配置 |
| 语音 Q&A 完整链路 | ✅ 前端 hooks + 后端 API 完整 |
| Complete 结算页面 | ✅ 已有实现 |
| Interest 6 标签 | ✅ 一致 |
| Narrative 打字机效果 | ✅ 已有 |
| Narrative 切换视角 | ✅ 允许查看其它兴趣标签 |
| Navigate COLD_SPOT_FLAVOR | ✅ 已有剧情化文案 |
| TopNav 密档按钮 | ✅ 已有 |

---

## 六、已记录、需其他 agent 处理

| 事项 | 文档 | 优先级 |
|---|---|---|
| 推荐算法重构（多因子加权评分） | `docs/diff-routing-algorithm.md` | P1 |
