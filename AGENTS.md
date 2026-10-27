# AGENTS.md · 在本仓库工作时的约定

给 AI 编码助手看的（也适用于人）。全局规则以 `~/.config/opencode/AGENTS.md` 为准，这里只写本仓库特有的。

## 这是什么

一个 OpenCode / Claude Code / Codex 通用的 **skill**，外加两个纯 Node 脚本（检查器 `forge.mjs`、配方生成器 `tokens.mjs`）。零依赖、零二进制、零遥测、不联网。

## 硬约定

- **不引入依赖**。两个脚本只用 Node 标准库；`--render` 复用全局 `puppeteer-core`，缺失时降级为静态档并明说。
- **不手改生成物**：`docs/index.html`、`docs/docs.css`、任何 `forge-tokens.css`。改源头（`RULES` / `recipes.json`），再跑生成器。
- **规则改动必须带测试**：`fixtures/bad.html` 加触发点 + `package.json` 的 `test:bad` 期望数字同步。
- **数字要真**：交付里写的 `FAIL/REFLEX/WARN` 必须是 `forge.mjs` 真跑出来的，不许手写。
- **中文优先**：规则文案、审查报告、提交信息用中文；代码标识符用英文。

## 命令

```bash
npm test                       # 唯一门禁：bad 精确计数 + good 为 0 + docs 为 0
npm run -s rules               # 规则目录
npm run -s recipes             # 配方列表
npm run -s docs                # 重新生成 docs/
npm run -s docs:check          # 用自家检查器审文档页
node skill/scripts/forge.mjs <target> [--json] [--render] [--shots] [--waive id]
```

## 目录职责

| 路径 | 职责 | 能不能手改 |
|---|---|---|
| `skill/SKILL.md` | 主流程与触发描述 | 能（改完新会话生效） |
| `skill/references/*.md` | 六份按需加载的手册 | 能 |
| `skill/data/recipes.json` | 8 套配方数据 | 能（唯一真源） |
| `skill/scripts/forge.mjs` | 规则表 + 扫描 + 输出 | 能（加规则看 EXTENDING） |
| `skill/scripts/tokens.mjs` | 发牌 + token 生成 | 能 |
| `docs/` | 生成的规则手册 | **不能** |
| `fixtures/bad.html` | 违规样例（18 项） | 能，加规则时必须加 |
| `fixtures/good.html` | 干净样例（0 项） | 能，但必须保持 0 |

## 提交前

```bash
npm test && node tools/build-docs.mjs && git status
```

`git status` 里如果出现 `docs/` 变动，说明规则或配方改了，要一起提交。
