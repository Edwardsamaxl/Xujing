# 叙境（Xujing）黑客松实施计划

> 版本：v1.0
> 日期：2026-05-23
> 适用：48 小时黑客松（2 天）

---

## 一、目标

将现有 **60% 完成度的 MVP 骨架** 打磨为**可扫码演示的完整叙事导流引擎**，在黑客松结束时验证核心假设：

> **游客会被 AI 生成的个性化剧情从热门馆引导到冷门馆。**

---

## 二、当前代码完成度

| 模块 | 状态 | 说明 |
|---|---|---|
| 项目架构 | 完成 | Monorepo、React+Vite、Express+Prisma+PostgreSQL |
| 前端页面框架 | 完成 | Start / Interest / Narrative / CheckIn / Reward / Complete 都存在 |
| 后端 API 路由 | 完成 | visitor/session、narrative/next-task、check-in、reward 都有 |
| 叙事引擎核心 | 完成 | route-planner、engine、DeepSeek 调用已连通 |
| **故宫真实数据** | **缺失** | seed.ts 用的是通用博物馆数据，非故宫 6 馆 |
| **3x3 连线导流** | **缺失** | route-planner 不区分出发点/目的地，无法实现定向引导 |
| **进度追踪** | **缺失** | Narrative 页面 progress 硬编码，与实际任务数不符 |
| **奖励发放** | **缺失** | reward/service.ts 只有查询，没有发放逻辑 |
| **错误/空态处理** | **缺失** | 网络断开、API 超时等没有 UI 反馈 |
| **部署** | **未做** | 无生产环境配置 |

---

## 三、实施阶段

### Phase 1：数据层重构（D1 上午，约 4 小时）

**目标**：把通用博物馆数据替换为故宫博物院真实试点数据，让后续开发有真实素材可跑。

| 任务 | 具体动作 | 验收标准 |
|---|---|---|
| 1.1 替换 seed 点位数据 | 将 `seed.ts` 中通用点位替换为 6 个故宫点位：3 个出发点（钟表馆、珍宝馆、武英殿·陶瓷馆）+ 3 个目的地（延禧宫、寿康宫、慈宁宫），配置正确的 `type`（`hot`/`cold`）和 `status` | `prisma db seed` 后数据库中有 6 条 spot 记录，type 和 status 正确 |
| 1.2 填充叙事模板 | 为 6 个点位 x 6 个兴趣标签 = **36 组模板**填充 `title`、`baseContent`、`flavorText` | 每个 spot 至少有 6 条 narrativeTemplate，覆盖历史/建筑/人物/亲子/悬疑/工艺 |
| 1.3 配置奖励 | 在 seed 中创建 3 个目的地各自的专属奖励，以及一个最终完成奖励 | reward 表中有 4 条记录 |

**风险缓解**：36 组文案填充耗时可由团队并行完成，每人负责 1 个馆点的 6 组文案；或先用 DeepSeek 基于 PRD 示例批量生成初稿，人工审核事实准确性。

---

### Phase 2：后端核心逻辑补齐（D1 下午，约 6 小时）

**目标**：让叙事引擎真正理解"从当前馆引导到目的地"的 3x3 连线逻辑，实现完整打卡-奖励闭环。

| 任务 | 具体动作 | 验收标准 |
|---|---|---|
| 2.1 重构 Route Planner | 修改 `route-planner.ts`：引入**当前所在点位**（`currentSpotId`）概念。规则：首次从 3 个 `type=hot` 出发点中选一个（可由 URL 参数指定）；后续每次从 3 个 `type=cold` 目的地中选一个未完成的；保持 `targeted > normal > crowded` 软排序 | 从钟表馆出发的游客，第一次 next-task 返回钟表馆讲解；第二次返回延禧宫/寿康宫/慈宁宫之一讲解 |
| 2.2 完善 Narrative Engine | 修改 `engine.ts`：接收 `currentSpotId`，区分"当前馆讲解"和"下一段引导"；优化 DeepSeek prompt，加入 3x3 连线语境 | API 返回的 narrativeText 包含当前馆讲解 + 目的地引导，语气温和连贯 |
| 2.3 实现奖励发放 | 完善 `check-in/service.ts`：每次打卡后检查是否完成全部目的地，若是则设置 `visitor.rewardIssued = true`；完善 `reward/service.ts`：返回已解锁奖励列表 | 完成第三个目的地打卡后，visitor 表 `rewardIssued` 为 true |
| 2.4 补齐 visitor session | 在 `visitor/session.ts` 中记录 `currentSpotId`，check-in 后更新 | session 表有 currentSpotId 字段 |

**技术备忘**：若 schema 缺少 `currentSpotId`，需加 Prisma migration：
```bash
cd server && npx prisma migrate dev --name add_current_spot
```

---

### Phase 3：前端体验打磨（D2 上午，约 6 小时）

**目标**：让 H5 在手机上看起来是完成品，动画、错误处理、加载态全部到位。

| 任务 | 具体动作 | 验收标准 |
|---|---|---|
| 3.1 优化 Narrative 页面 | 添加"当前：钟表馆"标识；按 DESIGN.md 设计卷轴卡片结构（标题 + 正文 + 分隔线 + 线索指向）；进度节点反映实际完成情况（3 段任务）；添加页面进入动画 | P3 剧情任务页与设计稿基本一致 |
| 3.2 完善加载与错误态 | 添加全屏加载遮罩（3 个圆点 pulse 动画）；网络断开时显示"网络暂时中断" + 重试按钮；DeepSeek fallback 时显示优雅降级文案 | 断网时有错误页，加载时有动画 |
| 3.3 完善 CheckIn 页面 | 按 DESIGN.md 添加"我还没到"次按钮；打卡按钮添加 2 秒防重复点击 | 双按钮布局，无重复打卡 |
| 3.4 实现 Complete 总览页 | 当前 Complete.tsx 只是 redirect 到 Reward。改为 P6 任务完成总览页：展示 3 张已解锁奖励缩略图 + 路线回顾 + "生成纪念卡"/"再探一次"双按钮 | 完成全部任务后进入 P6，能看到完整路线 |
| 3.5 适配与细节 | 所有页面底部按钮加 `env(safe-area-inset-bottom)`；横屏提示；检查 iOS Safari 和 Android Chrome 兼容性 | iPhone 底部横条不遮挡按钮 |

---

### Phase 4：部署与演示准备（D2 下午，约 4 小时）

| 任务 | 具体动作 | 验收标准 |
|---|---|---|
| 4.1 生产环境配置 | 配置 `.env`（DATABASE_URL、DEEPSEEK_API_KEY、DEEPSEEK_BASE_URL）；构建前端和后端 | 本地 `npm run build` 无报错 |
| 4.2 服务器部署 | 云服务器安装 Node.js、PostgreSQL、Nginx、PM2；Nginx 配置静态文件服务 + API 代理到 3000 端口；配置 HTTPS | 域名可访问，API 连通 |
| 4.3 数据库初始化 | 服务器上运行 `prisma migrate deploy` 和 `prisma db seed` | 服务器数据库有 6 个故宫点位和 36 组模板 |
| 4.4 二维码物料 | 生成 3 个出发点入口二维码（如 `https://你的域名/?campaignId=demo&spotId=spot-clock`），保存为图片 | 手机扫码能直接进入对应馆的起始剧情 |
| 4.5 演示彩排 | 完整走一遍：扫码 -> 选兴趣 -> 听钟表馆讲解 -> 去延禧宫 -> 打卡 -> 领奖励 -> 听下一段 -> ... -> 完成，记录每一步耗时和问题 | 全流程 5 分钟内走完，无阻塞 bug |

---

## 四、依赖项

| 依赖 | 获取方式 | 阻塞风险 |
|---|---|---|
| DeepSeek API Key | 已有（需确认额度充足） | 中 |
| 云服务器 + 域名 | 需提前准备 | 高 |
| PostgreSQL 数据库 | 服务器上自建或云数据库 | 低 |
| 6 馆 x 6 标签的文案 | 团队并行编写 | 中 |
| 3 张奖励插画图片 | 可先用占位图 / AI 生成 | 低 |

---

## 五、风险与应对

| 风险 | 等级 | 应对 |
|---|---|---|
| 36 组文案写不完 | 高 | PRD 已有钟表馆和寿康宫范例；其余用 DeepSeek 基于真实史料生成初稿，团队 2 人并行审核，每馆 30 分钟内 |
| Route Planner 3x3 逻辑复杂化 | 中 | 不追求全局最优，只保证：第一次返回出发点讲解，后续返回未去过的目的地，按 `targeted > normal` 排序 |
| DeepSeek API 延迟高 | 中 | 先展示加载态；设置 8 秒超时，超时后返回模板 baseContent |
| 手机浏览器兼容性问题 | 中 | 只保证 iOS Safari 和 Android Chrome；避免前沿 CSS |
| 奖励插画来不及画 | 低 | MVP 用 SVG 图标 + 馆名文字代替真实插画 |

---

## 六、人员分工建议（3-4 人团队）

| 角色 | 负责 | 具体文件 |
|---|---|---|
| 后端开发 | Phase 2 全部 + Phase 1 schema 调整 | `server/src/narrative/*`, `server/src/check-in/*`, `server/src/reward/*`, `server/prisma/schema.prisma` |
| 前端开发 | Phase 3 全部 | `apps/visitor-web/src/pages/*`, `apps/visitor-web/src/components/*` |
| 内容/文案 | Phase 1 的 36 组模板文案 + 奖励描述 | `server/prisma/seed.ts` 中的 narrativeTemplate 数据 |
| 运维/部署 | Phase 4 全部 + 服务器准备 | Nginx 配置、PM2、二维码生成 |

---

## 七、最小可行演示（MVP of MVP）

若时间极度紧张，**必须保住的底线**：

1. 6 个故宫点位数据正确（seed 可跑）
2. 从出发点 -> 目的地的 3x3 连线能通（route-planner 随机选一个目的地也可）
3. 前端 H5 能扫码打开、选标签、看剧情、打卡、领奖励
4. 部署到公网，评委手机能扫

**可砍的功能**（不影响核心验证）：
- DeepSeek 实时生成（模板 baseContent 直接展示也可）
- 精美的奖励插画（SVG 占位）
- P6 任务完成总览页（完成直接显示最终奖励）
- 进度节点动画

---

## 八、关键接口速查

```bash
# 创建游客会话
POST /api/visitor/session
Body: { campaignId: string, interestTags: string[], currentSpotId?: string }

# 生成下一段剧情
POST /api/narrative/next-task
Body: { visitorId: string }

# 打卡确认
POST /api/check-in
Body: { visitorId: string, spotId: string }

# 查询奖励
GET /api/reward?visitorId=xxx
```

---

## 九、环境变量配置

后端 `.env` 文件需要以下变量：

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/xujing"
DEEPSEEK_API_KEY="your-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
PORT=3000
```

> 注意：`DEEPSEEK_BASE_URL` 已从代码硬编码中抽离，支持通过环境变量配置，方便切换代理或国内中转地址。
