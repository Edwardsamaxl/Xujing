# 推荐算法设计文档（v0.2）

> 目标：把三层推荐逻辑（Explore 弱推荐 / Narrative 下一站 / Navigate 附近判断）统一到一套多因子评分模型下，通过故事进行软引流，**不介入运营意志**。

---

## 1. 现状与问题

| 场景 | 当前逻辑 | 核心问题 |
|---|---|---|
| Explore 顶部弱推荐 | `getRecommendedSpot()`: `(hour + remaining.length) % remaining.length` | 伪随机，完全不考虑拥堵/兴趣/距离 |
| Narrative "去下一个地点" | `planRoute()`: cold spot 按 `status` 排序（targeted>normal>crowded），同优先级取第一个 | 只考虑运营引流优先级，忽略兴趣、距离、当前位置 |
| Navigate 附近提示 | `isNearby: distance < 100`，distance 来自前端静态 SPOT_GRAPH | 阈值固定 100m，对故宫殿宇偏小；未利用真实 GPS |

---

## 2. 设计原则

1. **故事驱动，软引流**：推荐理由必须是叙事钩子（"暗格中的佛珠正在等你"），而非管理指令（"寿康宫人少"）。
2. **无运营意志介入**：不使用 `status`（targeted/normal/crowded）作为评分因子。`paused` 仅作为可用性硬约束过滤。
3. **统一评分模型**：Explore 弱推荐与 Narrative 下一站共用同一套 `scoreSpot()` 核心函数。
4. **可解释性**：每个推荐结果附带 `reason` 文案，游客知道"为什么推荐这里"。
5. **MVP 可落地**：不引入新依赖，不改动数据库 schema，基于已有数据（Spot、SpotConnection、NarrativeTemplate、SPOT_GRAPH）完成。

---

## 3. 核心模型：三因子加权评分

对每一个候选点位（未完成的 cold spot），计算综合得分：

```
score = w_distance   × distanceScore
      + w_interest   × interestScore
      + w_connection × connectionScore
```

### 3.1 各因子定义

| 因子 | 取值范围 | 计算方式 |
|---|---|---|
| `distanceScore` | 0–1 | `1 − walkTime / MAX_WALK_TIME`，`MAX_WALK_TIME = 15`（分钟），<0 时取 0 |
| `interestScore` | 0–1 | 若该点位存在 `NarrativeTemplate` 匹配游客首选兴趣标签，则为 1，否则 0 |
| `connectionScore` | 0.3–1 | 若当前位置到候选点存在 `SpotConnection`，则为 1；否则 0.3（保底） |

### 3.2 硬约束（可用性过滤，非运营意志）

以下点位直接从候选集中排除，不参与评分：
- 已完成的 spot
- `type !== 'cold'` 的 spot（只推荐目的地）
- `status === 'paused'` 的 spot（点位不开放）

### 3.3 权重配置（MVP 默认值）

```typescript
const WEIGHTS = {
  distance:   1.2,  // 走不动就什么都没了，故宫殿宇间 3min vs 9min 差异巨大
  interest:   1.0,  // 感兴趣才愿意去
  connection: 0.8,  // 故事钩子，软引流的核心手段
}
```

> 权重总和不需要归一化，因为最终只比较相对大小。

### 3.4 评分示例

假设游客在**钟表馆（spot-clock）**，兴趣标签为**悬疑**，剩余候选点为延禧宫/寿康宫/慈宁宫：

| 候选点 | walkTime | interest | connection | raw score | 说明 |
|---|---|---|---|---|---|
| 延禧宫 | 3min → 0.8 | 1 | 1 | 0.96 + 1.0 + 0.8 = **2.76** | 距离最近 + 有悬疑模板 + 有 hookFact |
| 寿康宫 | 8min → 0.47 | 1 | 1 | 0.56 + 1.0 + 0.8 = **2.36** | 次优 |
| 慈宁宫 | 9min → 0.4 | 1 | 1 | 0.48 + 1.0 + 0.8 = **2.28** | 第三 |

系统推荐**延禧宫**，因为距离最近、有悬疑叙事模板、有剧情 Connection 钩子。没有任何运营指令介入。

---

## 4. 两个应用场景的实现

### 4.1 Explore 顶部弱推荐

**当前**：前端本地伪随机 `getRecommendedSpot()`。  
**改为**：调用后端 `POST /api/narrative/recommend`，获取带文案的推荐结果。

**为什么走后端**：
- 权重参数后端统一控制，便于后续 A/B 实验
- 游客已完成状态在后端更权威（防止 localStorage 被篡改或不同设备不同步）
- 未来接入真实客流数据时，后端可实时更新

**文案生成策略**：

```
if (存在 SpotConnection) {
  reason = connection.hookFact + "此刻" + spotName + "人少路近，" + payoffText 的引导后半句
} else {
  reason = spot.teaser + "此刻" + spotName + "人少路近，可优先前往。"
}
```

**示例输出**：
> "写字人钟底座的纹路与延禧宫当年水殿遗存的铸铁构件，都指向清末中西工法的交融。此刻延禧宫人少路近，去那里，残图能揭开这段中西合璧的工法秘密。"

前端 UI：保留当前弱提示样式，文案替换为 `reason`，按钮 `[去看看]` / `[忽略]`。

### 4.2 Narrative "去下一个地点"

**当前**：`planRoute()` 只按 status 排序。  
**改为**：直接调用统一的 `scoreSpot()`，返回最高分点位。

**推荐理由**：在 Narrative 页面底部展示时，文案从 `SpotConnection.payoffText` 提取：

> "寿康宫里藏着另一种对时间的理解——不是齿轮的滴答，而是四十二年的晨昏定省。"

底部操作按钮保持三个：`[接受推荐]` / `[重新随机]` / `[回地图自选]`。

---

## 5. 附近判断优化

### 5.1 问题

当前 `isNearby: distance < 100` 阈值对故宫殿宇偏小（如慈宁宫花园纵深即超百米），且基于静态 SPOT_GRAPH，未利用真实 GPS。

### 5.2 方案

**MVP 阶段（静态距离 + 宽松阈值）**：
- 打卡可用阈值：`distance < 150m` 且 `walkTime < 3min`
- 附近提示阈值：`distance < 300m`（提前提示"你已接近目标"）

**后续增强（真实 GPS fallback）**：
- 前端通过 `navigator.geolocation.getCurrentPosition` 获取真实坐标
- 与目标点位经纬度计算真实距离（需要在 Spot 表中增加 `lat/lng` 字段）
- 真实 GPS 优先，失败时 fallback 到静态 SPOT_GRAPH

---

## 6. API 设计

### 6.1 新增接口

```typescript
// POST /api/narrative/recommend
// 用于 Explore 页面顶部弱推荐
Request: {
  visitorId: string
  currentSpotId?: string  // 若未打卡过，可空
}

Response: {
  spotId: string
  spotName: string
  reason: string        // 剧情化推荐理由文案
  distance: number      // 步行距离（米）
  walkTime: number      // 预计步行时间（分钟）
  isNearby: boolean     // 是否已在附近（< 150m）
}
```

### 6.2 现有接口改造

`POST /api/narrative/next-task` 和 `POST /api/narrative/task` 中的 `planRoute()` 内部改为调用统一的 `scoreSpot()` 模型，返回值不变，但推荐质量提升。

---

## 7. 实现步骤

### Phase 1 — MVP 本周完成

1. **后端**：重写 `server/src/narrative/route-planner.ts`
   - 实现 `scoreSpot()` 三因子评分函数
   - `planRoute()` 改为基于评分排序
   - 新增 `recommendSpot()` 用于 Explore 场景（返回含文案的推荐结果）
2. **后端**：新增 `POST /api/narrative/recommend` 路由
3. **前端**：新建 `apps/visitor-web/src/api/recommend.ts` 调用封装
4. **前端**：改造 `apps/visitor-web/src/pages/Explore.tsx`
   - `getRecommendedSpot()` 改为调用 `/api/narrative/recommend`
   - 弱提示文案使用 API 返回的 `reason`
5. **前端**：改造 `apps/visitor-web/src/utils/route-planner.ts`
   - `isNearby` 阈值从 100m 改为 150m
   - 保留 `getRouteTo()` 和 `getNextRecommendedSpot()`（可废弃或改为调用 API）
6. **前端**：改造 `apps/visitor-web/src/pages/Navigate.tsx`
   - `isNearby` 判断使用新阈值 150m
7. **测试**：验证以下场景推荐结果符合预期
   - 钟表馆 + 悬疑兴趣 → 应优先推荐延禧宫（最近 + 有悬疑模板 + 有 connection）
   - 珍宝馆 + 亲子兴趣 → 应优先推荐寿康宫（有 connection + 有亲子模板）
   - 已完成点位 → 不应出现在候选集中

### Phase 2 — 后续优化

1. **真实 GPS**：Spot 表增加 `lat/lng`，Navigate 页面接入 `navigator.geolocation`
2. **时间因子**：增加活动时间段权重（如闭馆前 1 小时优先推荐近处点位）
3. **A/B 实验**：权重参数化存储，支持不同 campaign 配置不同权重
4. **商户权益**：v0.2 接入商户点位时，增加 `merchantBonus` 因子

---

## 8. 需要改动的文件清单

| 文件 | 改动内容 |
|---|---|
| `docs/diff-routing-algorithm.md` | 本文档 |
| `server/src/narrative/route-planner.ts` | 重写评分模型，新增 `scoreSpot()` / `recommendSpot()` |
| `server/src/narrative/interface.ts` | 新增 `POST /api/narrative/recommend` 路由 |
| `server/src/narrative/engine.ts` | `generateTask` / `generateSpotNarrative` 中的 `planRoute()` 调用保持不变（内部已升级） |
| `apps/visitor-web/src/api/recommend.ts` | 新增前端 API 封装 |
| `apps/visitor-web/src/pages/Explore.tsx` | 弱推荐改为调用后端 API，文案使用 `reason` |
| `apps/visitor-web/src/utils/route-planner.ts` | 阈值调整，保留 `getRouteTo()` |
| `apps/visitor-web/src/pages/Navigate.tsx` | `isNearby` 判断使用新阈值 150m |

---

## 9. 关键决策记录

| 决策 | 选择 | 原因 |
|---|---|---|
| 为何去掉 `statusScore` | 产品定位是故事软引流，不是运营意志驱动 | 用户明确要求"运营意志不能介入" |
| 为何去掉 `coldBonus` | 候选集本来就是 cold spots，该因子恒定，不影响排序 | 简化模型，避免无意义计算 |
| `paused` 为何还过滤 | 可用性硬约束，非运营意志 | 点位不开放时不能推荐，属于安全底线 |
| `crowded` 如何处理 | 不作为评分因子，也不强制过滤 | 交给游客自主选择，文案中不强调拥挤 |
| 评分模型 vs 规则引擎 | 加权评分 | 规则引擎在因子增多时组合爆炸，加权评分更易扩展和调参 |
| Explore 弱推荐走前端还是后端 | 后端 API | 权重后端统一控制，未来接入实时客流数据无需改前端 |
| connectionScore 为什么保底 0.3 | 避免无 Connection 时该因子归零 | 保证即使无剧情连线，其他因子仍能有效排序 |
