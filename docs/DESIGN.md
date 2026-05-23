# 叙境 DESIGN.md

## 1. Visual Theme and Atmosphere

**数字文牒** — 以清宫档案为物质隐喻，将宣纸、朱砂批注、洒金笺、墨晕转化为可交互的数字界面。整体氛围是克制的仪式感和手作温度：不追求华丽装饰，而是通过材质肌理（纸张纤维、ink bleed）、动作仪式（盖章、卷轴展开）和色彩克制（暖灰纸底 + 一点朱砂）来传递"勘验档案"的叙事框架。

密度适中偏疏朗。正文行高 1.75-1.85，段落间留出足够呼吸空间，符合阅读长文本的叙事页需求；但按钮和关键操作保持紧凑，确保移动端单手可达。

**主题选择**：本方案为 light-mode 明确设计。H5 页面在户外通过手机浏览器使用，浅色底配合高对比墨色正文，保证阳光下可读性。深色模式暂不强制，但所有颜色基于语义 token，后续可扩展。

---

## 2. Color Palette and Roles

主色调采用"宣纸-墨色-朱砂"三色体系。所有色值使用 HEX 或 rgba，适配移动端 H5 CSS 环境。

| Token | Value | Role |
|---|---|---|
| `paper` | `#F7F4ED` | 页面底色、主表面。温暖米白，模拟宣纸 |
| `paper-deep` | `#EFEBE1` | 次级表面、输入框背景、折叠面板。比 paper 暗 4% |
| `ink` | `#2B2926` | 主文字、图标默认色。极深的暖黑，非纯黑 |
| `ink-dim` | `#6B6860` | 次级文字、说明文案、placeholders |
| `ink-faint` | `#A09B90` | 禁用态、最弱层级文字、装饰性英文标注 |
| `cinnabar` | `#A32626` | 主行动色、印章、完成态、关键高亮。朱砂红 |
| `cinnabar-light` | `#F5E3E3` | 选中态背景、轻量强调容器 |
| `gold` | `#B8923A` | 装饰性强调、印章边框、引文、角标。金箔色 |
| `gold-dim` | `rgba(184,146,58,0.10)` | 轻量装饰背景、引文框底色 |
| `scroll-line` | `#D4CFC3` | 分割线、边框、卡片描边。暖灰褐 |

**使用规则：**
- 一个页面里，cinnabar 只出现在 1-2 个核心操作按钮上，不铺满
- gold 只用于装饰和次级信息，永远不比 cinnabar 更显眼
- 绝不在彩色背景上用灰色文字。如需要弱化文字，用同色相更浅的变体
- **人流状态三色**：平稳 `emerald-500`、中等 `amber-500`、拥挤 `cinnabar`，仅用于人流指示器

---

## 3. Typography Rules

**字体策略：**
通过 `@font-face` 加载霞鹜文楷（LXGW WenKai）作为 Display 字体，正文使用系统字体栈确保性能与可读性。基于 375px 移动端视口定义尺寸。

```css
@font-face {
  font-family: 'LXGWWenKai';
  src: url('https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

**Font Families:**
- Display: `LXGW WenKai, PingFang SC, Noto Sans SC, sans-serif` — 页面标题、按钮、印章文字
- Body: `PingFang SC, Noto Sans SC, sans-serif` — 正文、描述
- Serif: `Cormorant Garamond, LXGW WenKai, serif` — 英文装饰标注、引文斜体

**Type Scale（严格 5 tiers，禁止中间字号）：**

| Level | Size | Line-height | Weight | Letter-spacing | Usage |
|---|---|---|---|---|---|
| Display | 28px | 1.30 | 700 | 0.04em | 页面主标题（选关中枢、密档寻踪） |
| Headline | 20px | 1.35 | 600 | 0.02em | 卡片标题、弹窗标题 |
| Body | 16px | 1.85 | 400 | normal | 叙事正文、长描述 |
| Caption | 12px | 1.50 | 400 | 0.04em | 标签、角标、辅助说明 |
| Overline | 11px | 1.40 | 400 | 0.10em | 英文小字、section eyebrow |

**禁止使用的字号：** 13px、14px、15px、18px、22px、24px、26px。已有的这些字号在后续重构中归并到最近的阶梯。

**规则：**
- Display 和标题使用霞鹜文楷，传递人文书法气息；正文使用系统无衬线，保证长时间阅读舒适度
- 大字号（18px 以上）使用正字间距或微正间距，不压缩，中文压缩会降低辨识度
- 仅对数字和计数器使用 `font-variant-numeric: tabular-nums`
- 大字号不加粗时（如 28px weight 400）不可用于标题，必须 weight ≥ 600

---

## 4. Component Stylings

### 主按钮（Primary Action）
- 背景：`cinnabar`
- 文字：`paper`，16px，Weight 500
- 圆角：`radius-pill`（完全圆角，即 9999px）
- 高度：48px，最小触控区域满足 40px
- 状态：
  - Hover（`@media(hover:hover)`）：`#D44A4A`，`shadow-[0_4px_16px_rgba(163,38,38,0.15)]`
  - Active：`scale(0.96)`，transition 150ms ease-out
  - Disabled：`bg-ink-faint/20 text-ink-faint/40`，无 active scale

### 次按钮（Secondary Action）
- 背景：透明
- 边框：1px solid `cinnabar`
- 文字：`cinnabar`，16px
- 圆角：`radius-pill`
- Active：`scale(0.96)`

### Ghost 按钮
- 边框：1px solid `gold`
- 文字：`gold`
- 用于低优先级操作（如"随机探索"）

### 卷轴卡片（ScrollCard）
- 背景：`card-elevated` 工具类（线性渐变 + 内阴影 + 外阴影）
- Border: `1px solid scroll-line`
- Top accent: `card-gold-accent` 在需要时添加（顶部 1px 金线）
- 圆角：`rounded-xl`（12px）
- 内边距：20px
- **禁止在 ScrollCard 内部再嵌套一个带 border + radius 的子容器**。信息分组用 `bg-paper-deep` 色块 + 细线分割

### TopNav
- 高度 56px，sticky top-0，z-50
- 背景: `bg-paper/80 backdrop-blur-md`
- 底部边框: `border-b border-scroll-line/50`
- 标题: 16px（Body 层级），居中
- 返回按钮: 40×40px 最小点击区

### 印章（Seal）
- 外层圆: `border-2` + `rounded-full`，borderColor 用 cinnabar 或 cinnabar/45（已完成态）
- 内层文字: Display 字体，主字 16px，副字 7px + tracking 0.14em
- 已完成时主字改为"勘"，副字改为"已勘"
- **不做** glassmorphism 或阴影，保持扁平朱红印泥质感

### Section Header
- 结构: 左侧 4px 高 cinnabar 圆角竖条 + 右侧文字
- 竖条: `w-1 h-4 bg-cinnabar rounded-full`
- 文字: Caption 12px，`text-ink-light tracking-[0.04em]`
- **禁止**把竖条加宽到 2px 以上作为装饰

### 兴趣标签（Interest Tag）
- 默认：背景 `paper-deep`，边框 1px `scroll-line`，文字 `ink-dim`
- 选中：背景 `cinnabar-light`，边框 1px `cinnabar`，文字 `cinnabar`
- 圆角：`radius-pill`
- 内边距：8px 16px
- Transition：background-color 200ms, border-color 200ms, color 200ms

### 进度节点（Progress Node）
- 已完成：实心圆，背景 `gold`，大小 10px
- 当前：实心圆，背景 `cinnabar`，大小 12px，外围 1px 同色圆环
- 未完成：空心圆，边框 1px `scroll-line`，大小 10px
- 连接线：1px solid `scroll-line`

### 输入框（Input Field）
- 背景：`paper`
- 边框：底部 1px solid `scroll-line`（仅底边，非全包围）
- 聚焦：底部变为 `cinnabar`
- 文字：`ink`，16px
- Placeholder：`ink-faint`

---

## 5. Layout Principles

**视口适配：**
页面必须包含 `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`。

**容器：**
- 最大宽度: 480px（`max-w-[480px]`），居中于视口
- 水平内边距: 20px（px-5），小屏（<380px）时收紧到 18px

**间距阶梯：**

| Token | Value | Usage |
|---|---|---|
| space-xs | 4px | 图标与文字间隙 |
| space-sm | 8px | 相关元素之间 |
| space-md | 16px | 段落/模块之间 |
| space-lg | 24px | 大模块之间 |
| space-xl | 32px | 页面分区 |

**卡片less原则：**
- 默认不用卡片容器。信息分组优先使用：
  1. 背景色阶（paper → paper-deep）
  2. 1px 分割线（scroll-line）
  3. 留白（space-lg 及以上）
- 仅在内容需要"从页面中抬升"时使用 ScrollCard：叙事正文区、Explore 地点卡片、弹窗内容

**卷轴隐喻：**
关键内容区（如任务卡、剧情文本）不使用标准卡片阴影，而是采用上下细线边框 + 略深背景色（`paper-deep`），模拟卷轴展开区域的边界。

**留白策略：**
generous whitespace。每屏只做一件事，拒绝信息堆叠。

**对齐：**
文字左对齐为主，按钮和短标题可居中。任务流以可用性优先。

---

## 6. Depth and Elevation

移动端 H5 环境下深度通过以下方式表达，**拒绝玻璃拟态和多层阴影**。

| Level | Treatment | Usage |
|---|---|---|
| 页面底层 | `paper` 纯色 | 页面底色 |
| 卷轴展开区 | `paper-deep` + 上下 `scroll-line` 1px 边框 | 输入区、折叠面板、信息分组底色 |
| Elevated | `card-elevated` 工具类 | 需要明显抬升的卡片 |
| 悬浮按钮/行动点 | `paper` 背景 + 单层阴影 `0 2px 8px rgba(43,41,38,0.08)` | 底部固定按钮 |
| 顶部导航 | `paper` 背景 + 底部 1px `scroll-line` 边框 | TopNav |
| Overlay | `bg-black/40` | 模态遮罩 |

**card-elevated 定义：**
```css
background: linear-gradient(180deg, #EFEBE1 0%, #F7F4ED 100%);
border: 1px solid #D4CFC3;
box-shadow:
  0 1px 2px rgba(43,41,38,0.06),
  0 4px 12px rgba(43,41,38,0.04),
  inset 0 1px 0 rgba(255,255,255,0.6);
```

**禁止：** 在 dark 背景上使用这套 elevation。本项目是 light-only。

---

## 7. Do's and Don'ts

1. **Do** 使用卷轴上下细线边框替代卡片阴影。**Don't** 使用带圆角阴影的通用卡片模板。
2. **Do** 让霞鹜文楷只负责标题和简短文案（≤20字）。**Don't** 用它渲染长段落正文，影响阅读效率。
3. **Do** 朱砂红（`cinnabar`）只出现在主按钮、当前进度节点、解锁提示上，占页面色彩面积不超过 10%。**Don't** 把朱砂用作大面积背景。
4. **Do** 保持每屏一个核心行动（CTA）。**Don't** 在任务引导页同时放两个同等权重的按钮。
5. **Do** 图片使用 `border-radius: 6px` 并加 inset outline `outline: 1px solid rgba(43,41,38,0.1); outline-offset: -1px`。**Don't** 让图片直接贴边或全屏出血无边界。
6. **Do** 所有动画使用 CSS transition（transform, opacity）。**Don't** 使用复杂 keyframe 动画或 `animation` 做花哨效果，避免低端机卡顿。
7. **Do** 打卡成功的页面进入动画用 400ms ease-out。**Don't** 使用 bounce 或 elastic 缓动。
8. **Do** 为所有 hover 状态包裹 `@media(hover:hover)`。**Don't** 让触摸设备上的元素保留永久 hover 状态。
9. **Don't** 在 ScrollCard 里再套一个带 border + radius 的 div。用 `bg-paper-deep` 色块或 `h-px bg-scroll-line` 分割内容。
10. **Don't** 使用 13px、14px、15px、18px、22px、24px、26px 等中间字号。必须落在 type scale 的 5 个阶梯上。
11. **Don't** 在移动端使用 `hover:` 状态作为唯一交互提示。所有 hover 效果必须有对应的 active/focus 状态。
12. **Don't** 使用纯黑（#000000）或纯白（#FFFFFF）。最暗是 ink `#2B2926`，最亮是 paper `#F7F4ED`。
13. **Don't** 使用 `transition: all`。必须列出具体属性。
14. **Do** 为所有页面切换保留至少一个入场动效（opacity + translateY 是最小值）。
15. **Do** 在按钮按下时使用 `active:scale-[0.96]`，给用户物理反馈。
16. **Do** 尊重 `prefers-reduced-motion`。所有关键动画都要有无动画回退。

---

## 8. Responsive Behavior

H5 页面运行在各类手机浏览器中，需适配不同屏幕尺寸和安全区。

**断点：** 本项目移动优先，只有一个收紧断点 `@media (max-width: 380px)`。

| Element | 默认 (≥380px) | <380px |
|---|---|---|
| 水平内边距 | 20px (px-5) | 18px |
| Start 页标题 | 36px | 33px |
| Start 进入按钮 | 116×116px | 108×108px |
| 容器最大宽 | 480px | 100% |

**视口：** 强制 `width=device-width, initial-scale=1.0`，禁止用户缩放。

**安全区：**
- iPhone 底部固定按钮区域增加 `env(safe-area-inset-bottom)` 的 padding-bottom
- 顶部状态栏高度通过 CSS `padding-top: env(safe-area-inset-top)` 或固定留白处理

**字号适配：** 所有尺寸使用 px，基于 375px 设计稿。在宽屏设备上（如平板）内容区最大宽度限制为 480px 并居中。

**横屏：** 通过 CSS `@media (orientation: landscape)` 提示用户竖屏使用，或保持单列布局自适应。

**触控目标：** 所有可交互元素最小触控区域 40×40px，小图标通过伪元素扩展热区。

---

## 9. Agent Prompt Guide

### 颜色速查
```
--paper: #F7F4ED
--paper-deep: #EFEBE1
--ink: #2B2926
--ink-dim: #6B6860
--ink-faint: #A09B90
--cinnabar: #A32626
--cinnabar-light: #F5E3E3
--gold: #B8923A
--gold-dim: rgba(184,146,58,0.10)
--scroll-line: #D4CFC3
```

### 组件 Prompt 示例

**Prompt 1: Section Header**
> 左侧 4px 圆角竖条（bg-cinnabar, w-1 h-4, rounded-full），右侧文字 Caption 12px text-ink-light tracking-[0.04em]。整体 flex items-center gap-2 mb-3。不要加背景卡片。

**Prompt 2: Primary Action Button**
> rounded-full, h-12, bg-cinnabar, text-white, Body 16px weight 500, tracking-[0.04em]。hover: shadow-[0_4px_16px_rgba(163,38,38,0.15)]。active: scale-[0.96], transition transform 150ms ease-out。

**Prompt 3: Info Grouping Without Nesting Cards**
> 容器用 bg-paper-deep rounded-lg p-4。内部用多个 flex justify-between 行，行与行之间用 `w-full h-px bg-scroll-line/30` 分割。不添加 border 或 shadow。

**Prompt 4: Seal Stamp Element**
> 圆形印章：h-[23%] aspect-square, rounded-full, border-2 border-cinnabar, flex flex-col items-center justify-center。内部主字 font-display text-[16px] text-cinnabar，副字 text-[7px] tracking-[0.14em]。已完成态 borderColor 改为 cinnabar/45，文字也弱化。

**Prompt 5: Page Entrance Animation**
> 页面根容器用 `transition-all duration-500 ease-out`，初始状态 `opacity-0 translate-y-4`，mounted 后改为 `opacity-100 translate-y-0`。配合 useEffect setTimeout 50ms 触发。

---

## 10. 页面清单与流转

### 10.1 页面清单

| 页面 | 路由 | 说明 |
|---|---|---|
| **Start** | `/` | 入口页。宣纸纹理背景，卷轴展开动效，音效 cue |
| **Interest** | `/interest` | 选择 1 个兴趣标签（历史/建筑/人物/亲子/悬疑/工艺），决定叙事风格 |
| **Explore** | `/explore` | 选关中枢。6 个地点卡片（16:9 比例），显示勘验状态 |
| **Navigate** | `/navigate?spotId=` | 路线引导。SVG 故宫简图 + BFS 路线动画，到达后解锁勋章 |
| **Narrative** | `/narrative?spotId=` | 剧情叙事页。AI 生成叙事 + 打字机效果 + 语音朗读 + AI 问答 |
| **Complete** | `/complete` | 结案页。统计数字、勋章藏宝阁、路线回顾、纪念海报生成 |

### 10.2 页面流转

```
扫码进入 → [Start] → 点击"开启勘验"
              ↓
       [Interest] → 选择标签 → 点击"进入秘辛地图"
              ↓
       [Explore] → 选择地点卡片
              ↓
       [Navigate] → 到达后点击"我已到达" → 解锁勋章
              ↓ 点击"收好勋章"
       [Narrative] → 阅读剧情 → AI 问答 → 点击"去下一个地点"
              ↓ （循环，直至 6 处全部勘验完毕）
       [Complete]
```

---

## 11. 各页面详细设计

### Start 入口页

**布局结构：**

```
┌─────────────────────────────┐
│  [safe-area-top]            │
│         ═══ emboss ═══      │  ← 顶部卷轴压纹装饰
│                             │
│    数字文旅勘验入口          │  ← Overline 11px，cinnabar
│                             │
│      故宫叙境               │  ← 主标题 36px 宋体，letter-spacing 0.16em
│        ·                    │  ← 朱砂圆点分隔
│      翻阅六百年             │
│                             │
│   扫码进入剧情，根据线索      │  ← 副标题 13px（→ Body 16px）
│   探访故宫冷门秘境。          │
│                             │
│        ┌─────────┐          │
│        │  开启   │          │  ← 圆形主按钮，116×116px，pill
│        │  勘验   │          │     背景 cinnabar，文字 paper
│        └─────────┘          │
│                             │
│         ═══ emboss ═══      │  ← 底部卷轴压纹装饰
│  [safe-area-bottom]         │
└─────────────────────────────┘
```

**关键要素：**
- 页面背景：`paper` + 多层纸张纹理（纵向红线 + 斜向纤维 + 水平水纹）
- 卷轴压纹：`start-emboss` 装饰元素，模拟宣纸折叠痕迹
- 标题：36px 宋体（`Songti SC`），非霞鹜文楷，更贴近古籍封面
- 进入按钮：圆形 pill，直径 116px（<380px 时 108px），带双重阴影
- 入场动效：文字 `startImprint` 盖章式显现（steps 动画），按钮 scale 弹出
- 点击后：卷轴左右面板向两侧滑出（`startPanelLeft/Right`），中央红线先延伸后消失

---

### Interest 兴趣选择页

**布局结构：**

```
┌─────────────────────────────┐
│  [safe-area-top]            │
│  ─ gold line ─              │  ← 顶部金线装饰
│                             │
│   择趣                       │  ← Display 28px
│                             │
│   选择你的探索偏好，          │  ← Body 16px ink-dim
│   决定密档的叙事风格          │
│   （只能选 1 个）             │
│                             │
│   ┌────────  ┌────────┐     │
│   │ [icon]  │ [icon]  │     │  ← 兴趣标签，2×3 网格
│   │ 历史    │ 建筑    │     │     每个卡片：图标 + 标题 + 描述
│   │ History │ Archi.. │     │
│   └────────  └────────┘     │
│   ┌────────  ┌────────┐     │
│   │ 人物    │ 亲子    │     │
│   └────────  └────────┘     │
│   ┌────────  ┌────────┐     │
│   │ 悬疑    │ 工艺    │     │
│   └────────  └────────┘     │
│                             │
│   ┌─────────────────────┐   │  ← 已选偏好预览（仅选中时显示）
│   │ 已选偏好 · 历史      │   │     bg-gold-dim, border-gold/10
│   └─────────────────────┘   │
│                             │
│        ┌───────────┐        │
│        │ 进入秘辛地图│       │  ← 主按钮，未选择时 disabled
│        └───────────┘        │
└─────────────────────────────┘
```

**关键要素：**
- 标签网格：2 列，间距 12px，每卡片高度自适应
- 标签默认态：bg-paper-deep，border scroll-line，文字 ink
- 标签选中态：bg-cinnabar-light，border cinnabar，文字 cinnabar，底部 2px cinnabar 指示线
- 右上角选中指示点：选中时显示 cinnabar 圆点
- 图标：28px stroke 线框图标，选中后变为 cinnabar 色
- 入场：整体 opacity + translateY，卡片 stagger 60ms

---

### Explore 选关中枢

**布局结构：**

```
┌─────────────────────────────┐
│  [safe-area-top]            │
│                             │
│   Explore · 秘辛地图         │  ← Overline 11px gold，font-serif
│   选关中枢                   │  ← Display 28px
│   剩余 4 处未探索 · 点击卡片  │  ← Body 16px ink-dim
│                             │
│   ┌─────────────────────┐   │  ← 弱推荐提示（可选）
│   │ ● 当前人流较少，建议 │   │     bg-paper-deep, border-gold/20
│   │   先去钟表馆看看     │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │  ← 地点卡片 1（16:9）
│   │ [图] 钟表馆          │   │     左侧文字区 64%，右侧图像
│   │ 铜壶滴漏 · 自鸣钟    │   │     左边缘垂直书签（红色）
│   │ 齿轮、滴漏与远洋贡品  │   │     右下角圆形印章
│   └─────────────────────┘   │
│   ┌─────────────────────┐   │  ← 地点卡片 2
│   │ [图] 珍宝馆          │   │     已完成态：opacity 75%，
│   │ ...                 │   │     grayscale 20%，印章变"勘"
│   └─────────────────────┘   │
│            ...              │
│                             │
│        ┌───────────┐        │
│        │  随机探索  │        │  ← Ghost 按钮，border gold
│        └───────────┘        │
└─────────────────────────────┘
```

**关键要素：**
- 卡片比例：**16:9 锁定**，右侧图像 object-cover object-right，左侧文字叠加在渐变蒙版上
- 卡片状态：
  - pending：默认，shadow-md，hover 时 shadow-xl + translateY(-2px)
  - active：ring-2 ring-cinnabar/40，shadow-lg（当前选中目标）
  - completed：opacity-75 grayscale-[0.2]，印章变为"勘/已勘"
- 左边缘书签：垂直 writing-mode，bg-cinnabar，文字 paper，宽 9.5%
- 右下角印章：圆形 border-2 cinnabar，含单字 + 副字
- 人流标签：圆角 pill，带 emerald/amber/cinnabar 小圆点
- 入场：stagger 动画，每张卡片依次淡入

---

### Navigate 路线引导页

**布局结构：**

```
┌─────────────────────────────┐
│  [safe-area-top]            │
│                             │
│   Navigate · 路线引导        │  ← Overline 11px
│   前往 钟表馆                │  ← Display 28px
│   景运门以东，奉先殿南侧      │  ← Body 16px ink-dim
│                             │
│   ┌─────────────────────┐   │  ← SVG 故宫简图（400×320 viewBox）
│   │                     │   │     外城墙轮廓 + 中轴线虚线
│   │    [故宫地图]        │   │     6 个点位圆点 + 名称标注
│   │    ──→ 路线动画      │   │     BFS 路线：虚线 + 流动圆点
│   │         ● (目标脉动)  │   │     目标点：脉动红圈
│   │                     │   │
│   │              320米   │   │  ← 右上角距离角标
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │  ← 路线信息卡
│   │ [冷宫提示]（可选）   │   │
│   │ 步行距离  320米      │   │
│   │ 预计时间  约5分钟     │   │
│   │ ─────────────────   │   │
│   │ ● 当前区域人流平稳   │   │  ← emerald/amber/cinnabar 圆点
│   └─────────────────────┘   │
│                             │
│        ┌───────────┐        │
│        │ 我已到达   │        │  ← 主按钮
│        └───────────┘        │
│        ┌───────────┐        │
│        │ 更换目标   │        │  ← 次按钮
│        └───────────┘        │
└─────────────────────────────┘
```

**关键要素：**
- SVG 地图：viewBox 0 0 400 320，基于故宫真实布局
  - 外城墙：rect stroke `#B8AE9A`，北/南墙加粗 2.5px
  - 中轴线：虚线，opacity 0.22
  - 门节点：小方块 + 名称标注（熙和门、隆宗门、景运门、锡庆门）
  - 6 点位：目标 cinnabar(r=6)，已完成 gold，未到达 `#D4CFC3`
  - 路线：stroke-dasharray 虚线 + markerEnd 箭头，+ 流动圆点 animateMotion
  - 目标脉动：r 10→18→10 循环动画
- 距离角标：absolute top-3 right-3，bg-cinnabar/90，白色文字
- 冷宫提示（isColdSpot）：bg-paper-deep border-gold/20，居中斜体
- 人流状态：emerald（平稳）、amber（中等）、cinnabar（拥挤）

**Reward Popup（到达后）：**
```
┌─────────────────────────────┐
│  █████████████████████████  │  ← 遮罩 bg-black/40 backdrop-blur-sm
│  █   ┌─────────────┐    █  │
│  █   │             │    █  │  ← 弹窗：bg-white rounded-2xl
│  █   │  [勋章大图]  │    █  │     sealStamp 动画（scale+rotate）
│  █   │   钟表馆     │    █  │
│  █   │  已勘验      │    █  │
│  █   │ ─────────── │    █  │
│  █   │ 秘辛已解锁   │    █  │
│  █   │ [teaser文字] │    █  │
│  █   │             │    █  │
│  █   │  收好勋章   │    █  │  ← 主按钮
│  █   └─────────────┘    █  │
│  █████████████████████████  │
└─────────────────────────────┘
```

---

### Narrative 剧情叙事页

**布局结构：**

```
┌─────────────────────────────┐
│  [TopNav] 钟表馆      [←]   │  ← sticky top-0
├─────────────────────────────┤
│  [密档按钮]        ────────  │  ← sticky top-14，右侧
├─────────────────────────────┤
│                             │
│   ┌─────────────────────┐   │  ← 叙事主卡片（ScrollCard）
│   │ 历史 视角            │   │     顶部渐变条 + gold 细线
│   ├─────────────────────┤   │
│   │ 齿轮里的中西合璧      │   │  ← Headline 20px
│   │ [语音条 · 点此朗读]  │   │  ← TTS 控制，脉冲条动画
│   │                     │   │
│   │ [打字机正文...]      │   │  ← Body 16px，行高 1.85
│   │ ▌                   │   │     末尾闪烁光标
│   │                     │   │
│   │   "引用文字"         │   │  ← flavorText，gold/70，斜体
│   │                     │   │
│   │ 下一处在延禧宫——    │   │  ← nextSpotHook，border-l gold/30
│   │ 灵沼轩的地下图纸...  │   │
│   └─────────────────────┘   │
│                             │
│   切换视角                   │  ← Caption 12px
│   ┌──── ┌──── ┌──── ┌────   │  ← 兴趣标签 pills
│   │历史│建筑│人物│悬疑│     │
│   └──── └──── └──── └────   │
│                             │
│   ┌─────────────────────┐   │  ← AI 问答区（出现时）
│   │ ● 你问              │   │     bg-gold-dim/30, border gold/20
│   │ 这钟是谁造的？       │   │
│   │ ─────────────────   │   │
│   │ AI  康熙时期的...    │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │  ← 提示气泡
│   │ 你可以问我：这扇窗...│   │     bg-paper-deep, 小三角箭头
│   └─────────────────────┘   │
│                             │
│          ┌─────┐            │  ← 麦克风按钮
│          │ 🎤  │            │     呼吸灯效果（gold ping）
│          └─────┘            │     录音中：cinnabar + 双圈 ripple
│        点击麦克风开始提问    │  ← Caption 11px
│                             │
│        ┌───────────┐        │
│        │ 去下一个地点│       │  ← 主按钮
│        └───────────┘        │
└─────────────────────────────┘
```

**关键要素：**
- 叙事卡片：ScrollCard，顶部 60px 渐变装饰条 + gold/20 底边
- 打字机效果：interval 20ms，逐字显示，末尾闪烁光标（w-0.5 h-4 bg-cinnabar/60 animate-pulse）
- TTS 语音条：4 根不同高度的竖条，播放时 animate-pulse，不同 delay
- 视角切换：pill 按钮组，active 态 bg-cinnabar + shadow，inactive 态 bg-paper-deep border scroll-line
- AI 问答：金色边框区域，animate-ink-bleed 入场，包含"你问"+问题、分隔线、"AI"头像+回答
- 麦克风按钮：64×64px 圆形，默认 gold 呼吸灯（animate-ping），录音中 cinnabar + 双层 ripple
- 底部按钮：`env(safe-area-inset-bottom)` padding

**密档侧栏（Archive Modal）：**
- 右侧滑入抽屉（`animate-slide-in-right`），宽 max-w-[360px]
- 列表：6 个地点卡片，当前页高亮（bg-cinnabar-light），已解锁（border-gold/20），未解锁（opacity-60）
- 每个卡片右侧小印章（"勘"字，旋转 -12deg）

---

### Complete 结案页

**布局结构：**

```
┌─────────────────────────────┐
│  [safe-area-top]            │
│                             │
│     密档寻踪·已完成          │  ← Display 28px
│   你穿越了 4 座宫殿          │  ← Body 16px ink-dim
│   找到了 3 条隐藏线索        │     数字使用 countUp 动画
│                             │
│   ● 勘验数据                 │  ← Section Header
│   ┌─────────────────────┐   │
│   │  4    3    960   80 │   │  ← 4 格统计，countUp 动画
│   │ 宫殿  密档  米   分  │   │     格间分隔线 scroll-line/8
│   └─────────────────────┘   │
│                             │
│   ● 勋章藏宝阁               │  ← Section Header
│   ┌─────────────────────┐   │
│   │ ┌──┐ ┌──┐ ┌──┐     │   │  ← 3×2 勋章网格
│   │ │勋│ │勋│ │? │     │   │     已解锁：正常显示
│   │ └──┘ └──┘ └──┘     │   │     未解锁：虚线圆 + ?
│   │ ┌──┐ ┌──┐ ┌──┐     │   │     stagger reveal 动画
│   │ │? │ │? │ │? │     │   │
│   │ └──┘ └──┘ └──┘     │   │
│   └─────────────────────┘   │
│                             │
│   ● 路线回顾                 │
│   ┌─────────────────────┐   │
│   │ 钟表馆 → 延禧宫 →    │   │  ← 文字路线，已完成加粗
│   │ 寿康宫 → 慈宁宫 ...  │   │
│   └─────────────────────┘   │
│                             │
│        ┌───────────┐        │
│        │ 生成纪念卡 │       │  ← 主按钮
│        └───────────┘        │
│        ┌───────────┐        │
│        │ 再探一次   │       │  ← 次按钮
│        └───────────┘        │
└─────────────────────────────┘
```

**关键要素：**
- 统计区：4 列等分，border-right 分隔（最后一格无），数字 24px Display bold，countUp 800ms stagger 100ms
- 勋章网格：3 列，gap-3。已解锁：正常 img object-contain + scale 入场。未解锁：78% 圆形虚线边框 + ? 文字，opacity-40
- 路线回顾：flex wrap，已完成 text-ink font-medium，未完成 text-ink-dim，箭头 svg
- 纪念海报弹窗：固定遮罩，居中 320px 宽海报，bg-paper，含顶部 gold 文字、勋章 3×2 网格、统计数据、footer 分隔线

---

## 12. 关键交互状态

### 12.1 加载态

**触发**：点击"进入秘辛地图"后等待 API；Narrative 页等待 AI 生成剧情。

**视觉：**
- 全屏或区域遮罩
- 3 个圆点 loader（`loader-dot`），依次 pulse，颜色 gold
- 文案："正在生成你的专属密档..."，Caption 12px

**规范：**
```css
.loader-dot {
  width: 6px; height: 6px;
  background: #B8923A;
  border-radius: 50%;
  animation: loaderPulse 1.4s infinite ease-in-out;
}
.loader-dot:nth-child(2) { animation-delay: 0.2s; }
.loader-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes loaderPulse {
  0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
  40% { transform: scale(1.4); opacity: 1; }
}
```

### 12.2 空态 / 错误态

**触发**：网络断开、API 超时、定位失败。

**视觉：**
- 图标：48px，淡色线描，`ink-faint`
- 标题：Headline 20px，"网络暂时中断"
- 正文：Body 16px，"请检查网络后重试"
- 按钮：次按钮，"重试"

**错误类型映射：**
| 类型 | 标题 | 正文 |
|---|---|---|
| 网络断开 | 网络暂时中断 | 请检查网络后重试 |
| API 超时 | 剧情生成中... | 服务器繁忙，请稍后重试 |
| 定位失败 | 无法确认位置 | 请到达馆内后再打卡 |

### 12.3 打卡成功反馈

**触发**：Navigate 页点击"我已到达"。

**动效序列：**
1. 遮罩淡入：`bg-black/40 backdrop-blur-sm`，opacity 0→1，700ms
2. 弹窗盖章：`animate-seal-stamp`（scale 2→1 + rotate -15deg→0deg，600ms，cubic-bezier 弹性）
3. 勋章图片：spot 专属勋章大图，w-52 h-52
4. 文字："{spot.name} 已勘验" + teaser
5. 用户点击"收好勋章"后：弹窗 fade out，700ms 后跳转到 Narrative

### 12.4 页面转场

- 默认：所有非 Start 页面使用 `PageTransition`，opacity 0→1 + translateY(16px)→0，500ms ease-out
- Start → Interest：卷轴左右面板滑出（`startPanelLeft/Right`），700ms
- 禁止：左右滑动切页（与浏览器返回手势冲突）

---

## 13. 业务场景映射

### 13.1 页面 → 业务场景的对应关系

| 页面 | 业务角色 |
|---|---|
| Start | 统一入口，品牌心智建立 |
| Interest | 决定叙事风格（历史/悬疑/亲子等），影响后续 6 组文案的语气 |
| Explore | **核心映射页**。6 个故宫冷门点位（钟表馆/珍宝馆/陶瓷馆/延禧宫/寿康宫/慈宁宫）的选择中枢 |
| Navigate | 基于真实故宫布局的 SVG 导览 + BFS 路线规划，到达后解锁该点叙事 |
| Narrative | 根据当前馆 + 兴趣标签生成 AI 叙事，支持语音朗读和自由问答 |
| Complete | 展示 6 处勘验完整路线、勋章收集、数据统计、纪念海报生成 |

### 13.2 6 个点位清单

| spotId | 名称 | 方位 | 兴趣标签映射 |
|---|---|---|---|
| spot-clock | 钟表馆 | 内廷东路 | 历史/建筑/人物/亲子/悬疑/工艺 |
| spot-treasure | 珍宝馆 | 外东路东北 | 历史/建筑/人物/亲子/悬疑/工艺 |
| spot-ceramic | 陶瓷馆 | 外朝西路 | 历史/建筑/人物/亲子/悬疑/工艺 |
| spot-yanxi | 延禧宫 | 东六宫 | 历史/建筑/人物/亲子/悬疑/工艺 |
| spot-shoukang | 寿康宫 | 外西路偏北 | 历史/建筑/人物/亲子/悬疑/工艺 |
| spot-cining | 慈宁宫 | 外西路偏南 | 历史/建筑/人物/亲子/悬疑/工艺 |

### 13.3 完整体验循环

游客在一次完整体验中，会经历**6 次"Explore → Navigate → Narrative"的循环**。每次循环解锁一个点位的叙事和勋章。6 处全部完成后进入 Complete 页。

```
Start → Interest → Explore 选择点位 → Navigate 导览到达
                                           ↓
                                    Narrative 阅读+问答
                                           ↓
                                    点击"去下一个地点"
                                           ↓
                                    回到 Explore（该点标记为已完成）
                                           ↓
                                    （循环，直到 6 处全部完成）
                                           ↓
                                    Complete 结案
```
