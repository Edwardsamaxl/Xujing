# 软引流推荐算法设计文档（v0.3）

> 目标：在 v0.2 三因子模型基础上，引入**停留时间**作为隐式反馈信号，构建四因子加权评分模型，让推荐从"用户说什么"进化到"用户实际做了什么"。

---

## 1. 现在的处理方法（v0.2）

### 1.1 当前架构

```
输入：visitorId
输出：{ spotId, reason, distance, walkTime, isNearby }

内部流程：
1. 查 visitor_session 获取兴趣标签（用户主动选择）
2. 查 check_ins 获取已完成点位（硬约束过滤）
3. Route Planner 三因子评分：distance + interest + connection
4. 取评分最高的 cold spot 作为推荐目标
5. 包装叙事化推荐理由文案
```

### 1.2 当前三因子模型

| 因子 | 来源 | 说明 |
|---|---|---|
| `distanceScore` | 静态 SPOT_GRAPH | `1 − walkTime / 15min`，越近越高 |
| `interestScore` | 用户初始选择 | 点位有匹配兴趣标签的模板则为 1，否则 0 |
| `connectionScore` | SpotConnection 表 | 有剧情连线则为 1，否则保底 0.3 |

**权重配置**：
```typescript
const WEIGHTS = {
  distance:   1.2,
  interest:   1.0,
  connection: 0.8,
}
```

### 1.3 当前问题

| 问题 | 表现 | 影响 |
|---|---|---|
| 兴趣标签是静态的 | 用户选"悬疑"后全程不变 | 无法发现用户的真实偏好偏移 |
| 没有利用行为信号 | 用户在 A 点停留 10min，在 B 点停留 1min，系统无感知 | 错过隐式反馈，推荐质量停滞 |
| 拥挤度只作硬约束 | 不介入评分，也不作为体验因子 | 可能推荐用户正在拥挤区域附近去另一个拥挤区域 |
| 疲劳度未建模 | 连续长距离移动后仍推荐远处点位 | 用户体力下降，到达率降低 |

---

## 2. 完善算法：四因子 + 隐式反馈模型

### 2.1 核心思想

**停留时间是最诚实的兴趣表达。**

- 用户说喜欢"历史"，但在"历史"点位只停留 30 秒 → 实际偏好存疑
- 用户没选"建筑"，但在建筑点位反复查看、停留 8 分钟 → 隐式兴趣强烈
- 用户快速跳过某个推荐 → 该推荐维度（风格/距离/叙事方式）权重应降低

### 2.2 四因子评分公式

```
score = w_distance   × distanceScore
      + w_interest   × interestScore
      + w_connection × connectionScore
      + w_dwell      × dwellTimeScore
```

新增 `dwellTimeScore`（停留时间偏好分），取值范围 0–1.5（可超过 1，作为强信号放大器）。

---

### 2.3 各因子详细定义

#### 因子 1：distanceScore（距离分）—— 不变

```typescript
function distanceScore(walkTime: number): number {
  const MAX_WALK_TIME = 15; // 分钟
  const score = 1 - walkTime / MAX_WALK_TIME;
  return Math.max(0, score);
}
```

> 疲劳度修正（新增）：若用户连续移动时间 > 20 分钟，`MAX_WALK_TIME` 临时降为 10，等效提高近处点位权重。

#### 因子 2：interestScore（兴趣分）—— 动态化

v0.2 是静态二分（有模板=1，无=0）。v0.3 改为**动态兴趣画像**：

```typescript
// 兴趣标签权重表，初始基于用户选择
type InterestProfile = {
  [tag: string]: number; // 0–1.5
}

function interestScore(spotId: string, profile: InterestProfile): number {
  const templates = getTemplatesForSpot(spotId);
  // 取该点位所有可用模板中，与用户兴趣画像匹配度最高的
  let maxScore = 0;
  for (const tmpl of templates) {
    const weight = profile[tmpl.tag] || 0;
    maxScore = Math.max(maxScore, weight);
  }
  return Math.min(maxScore, 1.5);
}
```

**初始化**：用户选择的标签设为 1.0，未选择的标签设为 0.3（保底探索意愿）。

#### 因子 3：connectionScore（剧情连线分）—— 不变

```typescript
function connectionScore(fromSpotId: string, toSpotId: string): number {
  const conn = getConnection(fromSpotId, toSpotId);
  return conn ? 1.0 : 0.3;
}
```

#### 因子 4：dwellTimeScore（停留时间偏好分）—— 新增

**定义**：根据用户历史在各点位的停留时间，推断其对"某类叙事/某类点位"的真实偏好强度。

```typescript
interface CheckInRecord {
  spotId: string;
  interestTag: string;   // 该点位实际使用的叙事标签
  dwellTime: number;     // 停留时间（秒）
  completed: boolean;    // 是否完整浏览
}

// 四类停留行为编码
function encodeDwellBehavior(dwellTime: number, medianDwell: number): string {
  if (dwellTime < 30) return 'skip';        // 秒跳，几乎没看
  if (dwellTime < medianDwell * 0.5) return 'glance'; // 快速浏览
  if (dwellTime < medianDwell * 1.5) return 'normal'; // 正常浏览
  return 'deep';                             // 深度沉浸
}
```

**停留时间偏好分计算**：

```typescript
function dwellTimeScore(
  candidateSpotId: string,
  history: CheckInRecord[],
  profile: InterestProfile
): number {
  // 1. 计算该用户历史平均停留时间（作为基线）
  const avgDwell = average(history.map(h => h.dwellTime));

  // 2. 按兴趣标签聚合历史停留行为
  const tagBehavior: Record<string, { deep: number; normal: number; glance: number; skip: number }> = {};
  for (const record of history) {
    const behavior = encodeDwellBehavior(record.dwellTime, avgDwell);
    const tag = record.interestTag;
    if (!tagBehavior[tag]) tagBehavior[tag] = { deep: 0, normal: 0, glance: 0, skip: 0 };
    tagBehavior[tag][behavior]++;
  }

  // 3. 计算候选点位各模板的 dwell 适配度
  const templates = getTemplatesForSpot(candidateSpotId);
  let maxScore = 0;

  for (const tmpl of templates) {
    const stats = tagBehavior[tmpl.tag];
    if (!stats) {
      // 无历史：使用当前兴趣画像作为先验
      maxScore = Math.max(maxScore, profile[tmpl.tag] || 0.3);
      continue;
    }

    const total = stats.deep + stats.normal + stats.glance + stats.skip;
    if (total === 0) continue;

    // 深度停留率越高，分数越高；跳过率越高，分数越低
    const deepRate = stats.deep / total;
    const skipRate = stats.skip / total;
    const score = 0.3 + deepRate * 1.2 - skipRate * 0.5;
    maxScore = Math.max(maxScore, Math.min(score, 1.5));
  }

  return maxScore;
}
```

**示例**：

| 历史行为 | 该标签的 dwellTimeScore |
|---|---|
| 深度停留 2 次，正常 1 次，跳过 0 次 | 0.3 + 0.67*1.2 - 0 = **1.1** |
| 深度停留 0 次，跳过 2 次，一瞥 1 次 | 0.3 + 0 - 0.67*0.5 = **-0.03 → 保底 0.1** |
| 无历史 | **0.3**（先验保底） |

---

### 2.4 权重配置（v0.3 默认值）

```typescript
const WEIGHTS = {
  distance:   1.2,  // 物理可达性仍是基础
  interest:   0.8,  // 下调：静态标签可信度降低，dwell 补位
  connection: 0.8,  // 叙事软引流核心
  dwell:      1.0,  // 新增：与 interest 同等重要
}
```

**为什么 `interest` 下调、`dwell` 给 1.0**：
- 用户口头选择（interest）不如身体行为（dwell）诚实
- 但完全去掉 interest 会导致冷启动时无方向，保留作为先验
- dwell 作为后验，动态校正 interest 的偏差

---

### 2.5 隐式反馈更新机制

每次用户完成一个点位的叙事浏览后，更新兴趣画像：

```typescript
function updateInterestProfile(
  profile: InterestProfile,
  record: CheckInRecord
): InterestProfile {
  const newProfile = { ...profile };
  const tag = record.interestTag;
  const behavior = encodeDwellBehavior(record.dwellTime, globalAvgDwell);

  // 学习率：停留越久，这次反馈的可信度越高
  const learningRate = behavior === 'deep' ? 0.3
                     : behavior === 'normal' ? 0.2
                     : behavior === 'glance' ? 0.1
                     : -0.2; // skip 是负反馈

  // 向边界平滑：避免单次极端行为造成剧烈跳变
  const current = newProfile[tag] || 0.3;
  const updated = current + learningRate * (1 - current); // 正向时减速逼近上限
  // 或：current + learningRate * current; // 负向时减速逼近下限

  newProfile[tag] = clamp(updated, 0.1, 1.5);
  return newProfile;
}
```

**更新时机**：在 `POST /api/check-in` 成功后，后端异步执行，存入 `visitor_session.interestProfile`（JSON 字段）。

---

### 2.6 拥挤度体验因子（可选，非运营意志）

虽然不使用 `status` 作为运营指令，但可以将**实时拥挤度**作为用户体验因子（类似地图 app 的路线时间估计）：

```typescript
function crowdingExperienceScore(crowdingLevel: 'low' | 'medium' | 'high'): number {
  // 不是强制过滤，而是轻微评分修正
  // 游客依然可以去拥挤区域，只是系统不主动优先推荐
  return { low: 1.0, medium: 0.9, high: 0.7 }[crowdingLevel];
}

// 最终得分可乘以 crowdingExperienceScore
// 或作为独立因子加入加权（权重建议 0.3，弱影响）
```

> 文案中不强调"人少"，但系统内部优先选择体验更好的点位。

---

## 3. 完整推荐流程（v0.3）

```
输入：visitorId, currentSpotId?
输出：{ spotId, spotName, reason, distance, walkTime, isNearby }

1. 查 visitor_session → 获取 interestProfile（动态）+ 初始兴趣标签
2. 查 check_ins → 获取历史停留记录（含 dwellTime, interestTag）
3. 硬约束过滤候选集（已完成 / paused / 非 cold）
4. 对候选集逐一点位计算四因子得分：
   - distanceScore(walkTime)
   - interestScore(spotId, profile)
   - connectionScore(currentSpotId, spotId)
   - dwellTimeScore(spotId, history, profile)
5. 加权求和，取 top-3
6. LLM 在 top-3 中做叙事化选择（可选，保留剧情连贯性）
7. 包装推荐理由文案（使用 SpotConnection.hookFact + payoffText）
8. 返回结果
```

---

## 4. 数据模型变更

### 4.1 check_in 表增强

```prisma
model CheckIn {
  id          String   @id @default(cuid())
  visitorId   String
  spotId      String
  // 新增字段
  interestTag String   // 该点位实际渲染的叙事标签
  dwellTime   Int      // 停留时间（秒）
  completed   Boolean  @default(true) // 是否完整浏览（快速跳过可为 false）
  createdAt   DateTime @default(now())
}
```

### 4.2 visitor_session 表增强

```prisma
model VisitorSession {
  id              String   @id @default(cuid())
  campaignId      String
  interestTags    String[] // 初始选择
  interestProfile Json?    // 动态兴趣权重 { "历史": 1.2, "建筑": 0.5, ... }
  currentSpotId   String?
  createdAt       DateTime @default(now())
}
```

> `interestProfile` 用 JSON 存储，便于灵活调整标签体系，无需改表。

---

## 5. 文案生成策略升级

### 5.1 基于 dwell 偏好的个性化叙事角度

系统知道用户对"悬疑"类叙事停留时间最长 → 即使推荐一个非悬疑点位，也可以从悬疑角度包装：

```typescript
function selectNarrativeAngle(spotId: string, profile: InterestProfile): string {
  // 选择用户兴趣权重最高的标签作为叙事角度
  const sortedTags = Object.entries(profile).sort((a, b) => b[1] - a[1]);
  const preferredTag = sortedTags[0][0];

  // 如果该点位有此标签模板，直接使用
  // 如果没有，使用 LLM 做角度迁移（"这个建筑背后的悬疑"）
  return preferredTag;
}
```

### 5.2 文案示例

**场景**：用户在延禧宫（悬疑角度）停留 12 分钟（深度），系统更新 profile 后 `悬疑: 1.3`。接下来推荐寿康宫。

**v0.2 文案**：
> "寿康宫里藏着另一种对时间的理解——不是齿轮的滴答，而是四十二年的晨昏定省。"

**v0.3 文案**（感知到用户对悬疑/秘密的偏好）：
> "寿康宫四十二年的晨昏定省里，有一样东西从未出现在任何史料里——嘉庆元年除夕，太妃的妆台下多了一枚来历不明的玉佩。去那里，你会知道为什么内务府的记录里，那一页被整幅撕去了。"

**差异**：同样推荐寿康宫，v0.3 的文案从"历史科普"迁移到"悬疑钩子"，因为系统知道用户吃这一套。

---

## 6. 关键决策记录

| 决策 | 选择 | 原因 |
|---|---|---|
| dwellTimeScore 为什么能超过 1 | 作为放大器，让用户真实偏好的点位突破静态标签限制 | 身体比嘴巴诚实 |
| 为什么保留 interest 先验 | 冷启动时无历史记录，需要初始方向 | 避免首屏推荐完全随机 |
| skip 为什么是负反馈 | 用户快速跳过 = 对该叙事角度/点位类型的否定 | 学习率 -0.2 确保能逐渐降低权重 |
| interestProfile 存 JSON 还是独立表 | JSON | 标签体系会迭代，独立表 schema 变更成本高 |
| crowding 为什么只作弱因子 | 产品定位是故事软引流，不是客流调控工具 | 避免运营感，但保障体验 |
| 疲劳度如何建模 | 连续移动 >20min 后临时降低 MAX_WALK_TIME | 简单有效，不引入复杂状态机 |
| 是否实时更新 profile | 是，check-in 后异步更新 | 下次推荐立即生效，无需等待 |

---

## 7. 实现优先级

### P0 — 本周完成（MVP 核心）
1. `check_in` 表增加 `interestTag`, `dwellTime`, `completed` 字段
2. `visitor_session` 表增加 `interestProfile` JSON 字段
3. 后端实现 `dwellTimeScore()` 计算函数
4. 后端改造 `scoreSpot()` 为四因子模型
5. 前端在 Narrative 页面记录 `dwellTime`（进入页面时计时，离开时上报）

### P1 — 下周完成（体验优化）
6. 前端在离开 Narrative 时调用 `POST /api/telemetry/dwell` 上报停留时间
7. 文案生成接入 `selectNarrativeAngle()`，使用动态兴趣画像选择叙事角度
8. 疲劳度修正：记录连续移动时间，调整距离权重

### P2 — 后续迭代
9. 拥挤度体验因子：接入景区实时客流数据
10. A/B 实验：不同权重配置的效果对比
11. 多目标优化：top-3 推荐由 LLM 做最终叙事连贯性选择

---

## 8. 附录：停留时间采集方案

### 8.1 采集时机

```typescript
// Narrative 页面
useEffect(() => {
  const startTime = Date.now();
  
  return () => {
    const dwellTime = Math.floor((Date.now() - startTime) / 1000);
    // 页面卸载时上报
    navigator.sendBeacon('/api/telemetry/dwell', JSON.stringify({
      visitorId,
      spotId,
      interestTag, // 当前渲染的标签
      dwellTime,
      completed: dwellTime > 30, // 至少看了 30 秒算完成
    }));
  };
}, []);
```

### 8.2 边缘情况处理

| 情况 | 处理 |
|---|---|
| 用户切换应用到后台 | 使用 Page Visibility API，后台时间不计入 |
| 用户快速返回上一页 | `dwellTime < 10s` 视为 `skip`，`completed = false` |
| 网络异常上报失败 | 本地 storage 缓冲，下次进入时重试 |
| 用户直接关闭浏览器 | `sendBeacon` 保证在 unload 时发送 |

---

*文档版本：v0.3*
*最后更新：2026-05-24*
*作者：Claude*
