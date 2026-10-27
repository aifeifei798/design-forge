# recipes：8 套视觉配方

配方 = **材料**，不是排版稿。它定纸、墨、强调色、字体、圆角、密度、动效曲线，不定区块顺序、不定文案。同一配方做两个不同的页面，应该长成两个不同的页面。

数据在 `skill/data/recipes.json`；改配方就改那个文件，不要手改生成出来的 `forge-tokens.css`。

## 八套

| slug | 名字 | 适用 | 材料 | 签名（首屏那个记忆点） |
|---|---|---|---|---|
| `broadsheet` | Broadsheet | 编辑部、报告、专栏、活动长页 | 暖纸 + 墨黑衬线 + 一点朱红，直角细线 | 一条贯穿版面的细墨线 |
| `signal` | Signal | 开发者工具、基础设施、监控台 | 深底 + 等宽 + 一个电光青，密度高 | 首屏一块实时数据 |
| `linen` | Linen | 生活方式、健康、订阅箱、社区 | 棉麻色 + 大圆角 + 极淡阴影 | 一张真实材质照片大圆角裁切 |
| `atelier` | Atelier | 高端产品、工作室、酒店、香水 | 近白纸 + 大字号差 + 直角 + 慢动效 | 巨大的产品名 + 极小规格行 |
| `arcade` | Arcade | 消费级 App、游戏、青少年、活动 | 明快纸 + 饱和珊瑚 + 大圆角 | 一个按下会变色的开关 |
| `quarry` | Quarry | 极简宣言、作品集、艺术项目、硬件 | 混凝土灰 + 黑白 + 安全橙，硬边形 | 4px 实线把首屏切两半 |
| `harbor` | Harbor | SaaS、后台、设置页、定价 | 冷白 + 单一蓝 + 紧凑密度 | 一个真实表格 |
| `nocturne` | Nocturne | 电影、音乐、夜店、影展、叙事长页 | 暗底 + 暖白 + 琥珀高光 + 慢动效 | 全幅暗调照片压标题 |

## 怎么选

```bash
node <skill-dir>/scripts/tokens.mjs deal --genre <genre>
```

genre：`editorial` / `technical` / `soft` / `luxury` / `playful` / `brutalist` / `product` / `dark`。

发牌给三个候选，按三件事选：

1. **素材能不能扛**：只有文字就没法做 Nocturne 的全幅照片；只有表格就别选 Broadsheet。
2. **动作在哪**：定价要精确（Harbor）、预约要氛围（Linen/Nocturne）、试用要能量（Arcade）。
3. **和隔壁会不会撞**：如果同类别邻居也会得到这个组合，就换一个轴（换纸或换强调色），在交付里说明。

用户点名配方就直接用，并记下"by request"。重新发牌只在用户要求时做。

## 落地

```bash
node <skill-dir>/scripts/tokens.mjs emit harbor --tailwind --out src/app/forge-tokens.css
node <skill-dir>/scripts/tokens.mjs emit harbor --out src/styles/forge-tokens.css --fonts
```

- `--tailwind` 出 `@theme` 块；不带则出 `:root` 自定义属性。
- `--density compact|normal|airy` 覆写默认密度（间距整体缩放）。
- `--fonts` 额外打印字体 `<link>` 建议；生产优先自托管。

## 自己加一套

配方是数据，不是代码。加一套的步骤：

1. 在 `recipes.json` 的 `recipes` 数组里复制一份，改 `slug` / `name` / `genre`。
2. 五个颜色必须给具体 `oklch` 的 `{l, c, h}`；`paper` 的 `l` 决定明暗（>60 为亮）。
3. `fonts` 三个角色；`displayClass` 只影响说明文字，用 `serif | grotesk | display | black`。
4. `do` / `dont` 各 3 条，必须具体到能执行（"不要圆角"而不是"要精致"）。
5. 跑 `node tokens.mjs recipes` 确认被识别，再 `show <slug>` 看渲染出来的 token。

## 允许偏离配方的情况

- 项目已有 `DESIGN.md` 或成熟 token 体系 → 用项目自己的，配方只借"密度/动效曲线"。
- 客户指定品牌色 → 把品牌色作为 `accent`，其余仍走配方结构。
- 配方与用户明确要求冲突 → 用户要求赢，在交付里写一句"按用户要求偏离配方 X"。

## 反模式

- 把配方当模板：整页照着签名的构图抄一遍。
- 同一项目混两套配方（一半衬线一半等宽），除非明确是"两段式叙事"。
- 为了用上某套配方而硬塞素材（没有照片就画照片）。
