# 扩展指南

这套东西的三个"可扩展点"都是数据或单函数，不需要懂整个工程。

## 1. 加一条检查规则

**改哪里**：`skill/scripts/forge.mjs` 顶部的 `RULES` 表 + 下方对应的扫描逻辑。

```js
// ① RULES 表里加一行：[档位, 一句话问题, 一句改法]
"type/line-height": ["REFLEX", "正文行高不在 1.5–1.65", "用 --leading-body token，别全局压 1.2"],
```

```js
// ② 在对应的分节里加扫描（多数规则都是这个形状）
const lineHeight = /line-height\s*:\s*([0-9.]+)\b/g;
while ((m = lineHeight.exec(code))) {
  const v = parseFloat(m[1]);
  if (v < 1.4 || v > 1.7) add(file, "type/line-height", m.index, `line-height: ${v}`);
}
```

⚠️ 三件必须同时做的事，否则 CI 会红或者规则会虚设：

1. **在 `fixtures/bad.html` 里加一个真实触发点**（不要只加规则不测）。
2. **把期望的数量写进 `package.json`**：`test:bad` 里的 `18` 改成新的总数。
3. 在 `skill/references/floor.md` 的对应档位表里补一行（id / 问题 / 为什么）。

跑：

```bash
npm test                              # 期望正好命中你写的新数字
node skill/scripts/forge.mjs --list-rules | tail -3
```

**别做的事**：不要在标记语言里扫自然语言正文。检查器只扫"代码"（标签与 `<style>` 块），正文扫描会把文档页误杀——这个坑踩过。

## 2. 加一套配方

**改哪里**：`skill/data/recipes.json`（只加数据，不碰代码）。

```json
{
  "slug": "kiln",
  "name": "Kiln",
  "genre": "editorial",
  "mood": "陶土、哑光、暖灰",
  "paper": { "l": 95, "c": 0.015, "h": 60 },
  "ink":   { "l": 24, "c": 0.02,  "h": 45 },
  "muted": { "l": 50, "c": 0.015, "h": 50 },
  "accent":{ "l": 58, "c": 0.12,  "h": 35 },
  "border":{ "l": 87, "c": 0.015, "h": 55 },
  "fonts": { "display": "Fraunces", "body": "Karla", "mono": "JetBrains Mono" },
  "displayClass": "serif",
  "radius": { "sm": "2px", "md": "4px", "lg": "6px", "pill": "4px" },
  "density": "normal",
  "motion": { "curve": "cubic-bezier(0.2, 0.7, 0.2, 1)", "duration": "200ms" },
  "signature": "一块陶土色块，只有一处，压着标题",
  "do": ["只用一种材质色", "字号对比大", "圆角只在小控件上"],
  "dont": ["不要冷色", "不要卡片网格", "不要阴影"],
  "hardShadow": false
}
```

规则：

- 五个颜色必须是 `{ l, c, h }` 三个数，`paper.l > 60` 视为亮色配方。
- `genre` 现在是固定的 8 种取值之一（`editorial` / `technical` / `soft` / `luxury` / `playful` / `brutalist` / `product` / `dark`）；要新增 genre 就在 `tokens.mjs` 的 `deal --genre` 里它会自动放开（按数据过滤，无需改代码）。
- `do` / `dont` 各 3 条，必须具体到能执行（"不要圆角"而不是"要精致"）。
- 跑完 `node skill/scripts/tokens.mjs recipes` 应能看到它；`show <slug>` 打印出 token；`emit <slug> --tailwind --out /tmp/t.css` 不报错。
- 顺手在 `skill/references/recipes.md` 的表格里补一行，并在 `CHANGELOG.md` 的 Unreleased 记一笔。

## 3. 加一份参考文档

**改哪里**：`skill/references/<name>.md`，然后在 `SKILL.md` 的"流程"里引用它，只在这一步需要时加载。

规矩：

- 一份文档只解决一个问题（现在六份正好：规则 / 手艺 / Tailwind / 状态 / 审查 / 配方）。
- 开头三行内说清"什么时候读这份"，不要写目录和引言。
- 数字要给具体值（`65–75ch`、`150–250ms`），不要写"适度""合理"。
- 总大小控制住：加一份之前先问它能不能塞进现有某一份。

## 4. 加一个命令

**改哪里**：`commands/forge-<verb>.md`，然后本机重新链接：

```bash
ln -sfn "$PWD"/commands/*.md ~/.config/opencode/commands/
```

写法约定：

- frontmatter 只放 `description`，需要不污染主上下文时加 `subtask: true`（只读、无需来回问答的流程适合）。
- 正文第一句永远是「Load the `design-forge` skill, then run its **<路径>** — read `<绝对路径>/references/<file>.md`」。
- 把这次运行的硬约束写清楚（只读？不跑浏览器？不许改哪些文件？）。
- 命令只做转发和约束，不复制规则正文——否则两份规则一定会分叉。

## 5. 验证清单（提交前）

```bash
npm test                       # bad 精确命中 / good 为 0 / docs 为 0
node tools/build-docs.mjs      # 文档重新生成（改了规则或配方必须跑）
git status                     # docs/ 的变动要一起提交
```

改了规则或配方却不重新生成 `docs/` 的，CI 的 pages workflow 会把文档重建一遍并检查，但仓库里的产物会落后——自己先跑一次更省事。
