# Explore 页背景卡片生图 Prompt

> 基于 `yanxi` 原始素材，生成对标 `history-card.png` 画质的横向背景卡片。
> 用途：Explore 页选关卡片的 `background-image`，16:9 比例，左侧需大量留白供文字叠加。

---

## 通用构图规范（所有 prompt 必须遵循）

```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration,
```

---

## 一、建筑 (architecture-card.png)

**原始素材核心元素**：灵沼轩水殿结构图、工程制图、西洋铁柱、水车、飞檐、未完工宫殿

**输出路径**：`/assets/explore/architecture/architecture-card.png`

**Prompt**：
```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration, architectural focus: Lingzhao Xuan (Crystal Palace) of Yanxi Palace, Western-style cast iron pillars and steel framework, traditional Chinese flying eaves and dougong brackets, water wheel mechanism, unfinished white marble base, faint architectural elevation drawing style, blend of East and West, pale ink lines with barely-there jade-green and bronze wash, serene and scholarly atmosphere,
```

---

## 二、人物 (figure-card.png)

**原始素材核心元素**：清代宫廷女性背影、精致发饰、刺绣云肩、窗格光影、紫色调服饰

**输出路径**：`/assets/explore/figure/figure-card.png`

**Prompt**：
```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration, figure focus: rear view of a Qing dynasty palace lady in faint silhouette, emphasis on exquisite hair ornaments (flower-and-phoenix hairpins), embroidered cloud collar (yunjian) with tassels, delicate silk robe patterns, blurred lattice window background suggesting palace interior, pale lavender and sepia ink wash, soft Rembrandt-like side lighting from window, melancholic and elegant atmosphere, figure must be faint and unobtrusive, merely a whisper of form,
```

---

## 三、亲子 (family-card.png)

**原始素材核心元素**：荷花池、游鱼、石灯笼、荷叶、古建筑倒影、龙纹、莲花纹圆盘

**输出路径**：`/assets/explore/family/family-card.png`

**Prompt**：
```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration, family-friendly garden scene: a serene lotus pond with stepping stones, a small stone lantern (toro), koi fish swimming beneath lotus leaves, distant Chinese pavilion reflected in water, magnolia branches overhead, faint dragon pattern subtly woven into water ripples, pale jade-green and soft pink lotus accents against beige paper, warm and inviting yet refined, like a page from a children's picture book rendered in Song dynasty gongbi style,
```

---

## 四、悬疑 (mystery-card.png)

**原始素材核心元素**：叠放的泛黄档案、建筑线描、红色印章、档案编号标签、尘封氛围

**输出路径**：`/assets/explore/mystery/mystery-card.png`

**Prompt**：
```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration, mystery archive scene: several overlapping aged archival documents with faint architectural line drawings of Lingzhao Xuan, a faded red imperial seal stamp, a label tag with handwritten archival number, all rendered as if seen through time and dust, sepia and aged-paper tones, subtle shadow layers suggesting depth, a sense of hidden secrets waiting to be uncovered, quiet suspense without being dark or gloomy, maintaining the warm parchment base,
```

---

## 五、工艺 (craft-card.png)

**原始素材核心元素**：珐琅、砖瓦、铜件、木雕、齿轮机械结构、工艺标本拼贴

**输出路径**：`/assets/explore/craft/craft-card.png`

**Prompt**：
```
Horizontal 16:9 rectangular card, traditional Chinese imperial archival aesthetic, textured rice paper background in warm parchment beige (#f4ead8), elegant gilt scroll-pattern border with decorative corner ornaments, left 35% kept as clean negative space with a vertical dark-cinnabar red bookmark strip ( rounded, embossed gold edge ), right 65% contains the main visual subject rendered in faint gongbi line-drawing with subtle ink wash color, extremely low saturation, muted tones, delicate and understated so text can be read over it, a faint circular seal placeholder in bottom right corner, soft paper grain texture throughout, no scratches, no noise, no abstract geometric simplification, museum-quality illustration, craft specimen study: close-up arrangement of traditional artisan elements including a lotus-patterned roof tile (wadang), a section of cloisonne enamel with floral motif, a brass gear wheel, carved wood joinery detail, and a bronze door knocker, all rendered as delicate museum catalog illustrations with fine line work, pale teal and bronze accents on beige paper, shallow depth of field effect through fading, emphasis on material texture through ink technique rather than photorealism, scholarly and refined,
```

---

## 生成检查清单

生成后请对比 `history-card.png` 检查：

- [ ] **比例**：16:9 横向长方形
- [ ] **底色**：暖米色宣纸纹理（#f4ead8 附近），不能是深色
- [ ] **边框**：金色卷草纹装饰边框 + 四角花纹
- [ ] **左侧**：约 35% 干净留白，有一条深红色竖条书签（圆角、金色压边）
- [ ] **右侧**：约 65% 主题视觉，必须是淡墨工笔/线描，低饱和度，不能抢眼
- [ ] **右下角**：浅色圆形印章占位
- [ ] **无噪点/划痕**：现有卡片最大的问题是满屏划痕和抽象几何，新图必须避免
- [ ] **文字可读性**：整个画面必须保证左侧文字叠加后清晰可读
