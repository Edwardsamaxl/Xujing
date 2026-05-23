# 叙境 — 项目架构文档

## 1. 项目概述

叙境是景区 AI 叙事导流引擎。通过生成式讲解和自适应剧情路线，把游客兴趣转化为可调度的游览行为，帮助景区缓解热门点拥堵、激活冷门区域。

本仓库为 **MVP 试点验证版**（v0.1），目标是在两周内完成可扫码体验的完整 demo，验证"游客会被个性化剧情引导改变路线"这一核心假设。

## 2. 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 前端 | React 18 + Vite + Tailwind CSS | H5 移动端页面，扫码即用 |
| 路由 | React Router DOM v6 | 单页应用，页面切换无白屏 |
| 后端 | Node.js + TypeScript + Express | REST API，Prisma ORM |
| 数据库 | PostgreSQL | 关系型数据存储 |
| AI | DeepSeek API | 剧情文本实时生成与个性化改写 |
| 部署 | 云服务器 + Nginx + PM2 | 国内访问稳定 |

## 3. 目录结构

```
xujing/
├── apps/
│   └── visitor-web/          # H5 游客端
│       ├── src/
│       │   ├── pages/        # 页面：兴趣选择 → 剧情 → 打卡 → 奖励
│       │   ├── components/   # 共享组件：卷轴卡片、进度节点、兴趣标签
│       │   └── utils/        # 本地存储工具
│       ├── index.html
│       ├── vite.config.ts
│       └── tailwind.config.js
├── server/
│   ├── prisma/
│   │   ├── schema.prisma     # 数据库模型定义
│   │   └── seed.ts           # 演示数据初始化
│   └── src/
│       ├── narrative/        # 叙事引擎 — 最深模块
│       │   ├── interface.ts  # API 路由：POST /next-task
│       │   ├── engine.ts     # 模板选择 + LLM 调用编排
│       │   ├── route-planner.ts # 规则筛候选 + 排序
│       │   └── prompts/      # DeepSeek 提示词模板
│       ├── spot/             # 点位查询
│       ├── check-in/         # 打卡记录（MVP 为按钮确认）
│       ├── reward/           # 奖励发放（插画卡片）
│       ├── visitor/          # 游客会话管理
│       ├── campaign/         # 活动配置读取
│       └── index.ts          # Express 入口
├── docs/
│   └── ARCHITECTURE.md       # 本文档
├── package.json              # Monorepo workspaces 配置
└── 叙境_PRD_v0.1.md
└── DESIGN.md
```

## 4. 核心模块设计

### 4.1 Narrative Engine（叙事引擎）

**深度模块**。对外接口极小，内部隐藏全部复杂度。

```
输入：visitorId
输出：{ narrativeText, nextSpotId, nextSpotName, taskType, rewardHint }

内部流程：
1. 查 visitor_session 获取兴趣标签
2. 查 check_ins 获取已完成点位
3. Route Planner 根据规则筛选候选点位并排序
4. 查 narrative_template 获取该点位+兴趣的基础素材
5. 构建 prompt，调用 DeepSeek API 生成个性化文本
6. 判断是否全部完成，决定是否展示奖励提示
```

**Route Planner 规则：**
- 硬约束：已完成的点位不再推荐；暂停引导的点位排除
- 软排序：targeted（重点引导）> normal > crowded
- MVP 取排序后第一个；v0.2 可引入 LLM 在候选集中做叙事化选择

### 4.2 Check-in（打卡验证）

**Seam（接口层）**。MVP 使用按钮确认适配器，后续可替换为二维码扫码或定位验证，无需改动调用方。

```
接口：POST /api/check-in { visitorId, spotId }
行为：记录打卡 → 更新 visitor 当前点位 → 检查是否全部完成 → 触发奖励
```

### 4.3 Reward（奖励发放）

MVP 支持插画卡片。每完成一个点位后发放该点位的专属插画卡片；`rewardIssued` 记录该 visitor 已领取的卡片列表。

## 5. 数据流

```
游客扫码 → /start
    → 无 visitorId → /interest（选择兴趣标签）
        → POST /api/visitor/session → 创建匿名会话 → 存 localStorage
    → 有 visitorId → /narrative
        → POST /api/narrative/next-task
            → 后端组装上下文 → Route Planner → DeepSeek 生成文本
        → 展示剧情 + "前往xxx"按钮
        → /check-in?spotId=xxx
            → 点击"确认到达" → POST /api/check-in
                → 未完成全部 → 回到 /narrative（下一段剧情）
                → 完成全部 → /reward（展示插画卡片）
```

## 6. 部署说明

### 开发环境

```bash
# 1. 安装依赖（根目录）
npm install

# 2. 配置后端环境变量
cp server/.env.example server/.env
# 编辑 .env：DATABASE_URL, DEEPSEEK_API_KEY

# 3. 初始化数据库
cd server
npx prisma migrate dev --name init
npx prisma db seed

# 4. 启动后端（端口 3000）
npm run dev

# 5. 启动前端（端口 5173，新终端）
cd apps/visitor-web
npm run dev
```

### 生产部署

1. **构建前端**
   ```bash
   cd apps/visitor-web
   npm run build
   # 产物在 dist/ 目录
   ```

2. **构建后端**
   ```bash
   cd server
   npm run build
   # 产物在 dist/ 目录
   ```

3. **服务器配置**
   - Nginx：前端静态文件由 Nginx 直接服务，API 请求代理到 `localhost:3000`
   - PM2：管理 Node.js 进程 `pm2 start dist/index.js --name xujing-api`
   - PostgreSQL：创建数据库并运行迁移

4. **二维码链接**
   - 入口二维码：`https://你的域名/?campaignId=demo`

## 7. 核心架构决策回顾

以下决策来自 grilling 对齐过程：

| 决策 | 选择 | 原因 |
|---|---|---|
| 前端形态 | H5（非小程序） | 扫码即用，无需下载或审核 |
| 前端框架 | React + Vite | SPA 体验优于 MPA，Vite 初始化仅需 5 分钟 |
| 后端语言 | Node.js + TypeScript | 前后端同语言，AI 调用直接用 SDK，开发最快 |
| 数据库 | PostgreSQL + Prisma | 关系型数据清晰，Prisma 迁移和 seed 开箱即用 |
| 剧情生成 | 固定语料库 + LLM 实时调整 | 语料库保证事实准确，LLM 负责个性化改写 |
| LLM 提供商 | DeepSeek | 国内网络直接访问，用户已有 API key |
| 打卡方式 | 按钮确认 | MVP 展示阶段不依赖真实定位，保留 seam 后续可替换为 GPS/二维码 |
| 游客身份 | 完全匿名 | 无需授权流程，localStorage 存随机 visitorId |
| RAG | 资料即模板 | 两周内无法搭建独立向量库，base_content 直接作为 LLM 上下文 |
| 奖励 | 插画卡片 | 每个点位完成后发放专属插画卡片；砍掉优惠券，聚焦核心叙事循环 |
| 部署 | 云服务器 | 国内访问稳定，评委扫码不受局域网限制 |
| 演示场景 | 故宫博物院 | 6 个点位（钟表馆、珍宝馆、武英殿·陶瓷馆 3 个出发点 + 延禧宫、寿康宫、慈宁宫 3 个目的地） |

## 8. 后续版本方向

- **v0.2**：运营后台仪表盘、A/B 路线测试、商户转化报表、更多叙事风格
- **v0.3**：接入票务/客流系统、真实二维码打卡、室内定位、多路线策略
- **v1.0**：多景区模板化复制、SaaS 年费、活动模板库

## 9. 关键接口速查

```bash
# 创建游客会话
POST /api/visitor/session
Body: { campaignId: string, interestTags: string[] }

# 生成下一段剧情
POST /api/narrative/next-task
Body: { visitorId: string }

# 打卡确认
POST /api/check-in
Body: { visitorId: string, spotId: string }

# 查询奖励
GET /api/reward?visitorId=xxx
```
