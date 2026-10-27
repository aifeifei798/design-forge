# design-forge

自建的 UI 设计与前端视觉质量工作流。一个 skill、一套检查器、一套配方，替代 `hallmark`、`impeccable`、`tailwind-design-system` 三家的叠加。

**规则手册（在线）**：https://aifeifei798.github.io/design-forge/ · **变更记录**：[CHANGELOG.md](CHANGELOG.md) · **各 harness 安装**：[HARNESSES.md](HARNESSES.md) · **自己加规则/配方**：[EXTENDING.md](EXTENDING.md) · **参与维护**：[CONTRIBUTING.md](CONTRIBUTING.md)

- **无二进制、无遥测、无运行时下载**，只用 Node 标准库
- **静态检查永远先跑**，渲染档可选（复用全局 `puppeteer-core` + Chrome）
- **配方是数据**：8 套 `/ 改 JSON 就多一套
- **中文优先**：规则、审查报告、交付语言都是中文

## 结构

```
skill/
├── SKILL.md                 主流程（会被 opencode 自动加载）
├── data/recipes.json        8 套视觉配方（机器可读）
├── references/
│   ├── floor.md             14 条 Floor + 12 条 Reflex + Finish 清单
│   ├── craft.md             排版/间距/色彩/布局/动效/图片/文案
│   ├── tailwind.md          Tailwind v4 CSS-first token 与组件写法
│   ├── states.md            八态/表单/空态/边界/暗色
│   ├── audit.md             审查与重做流程
│   └── recipes.md           配方选择与自建
└── scripts/
    ├── forge.mjs            确定性检查器
    └── tokens.mjs           发牌与 token 生成
fixtures/                    自测样例（bad 全违规，good 全干净）
commands/                    opencode 斜杠命令（/forge、/forge-audit、/forge-redo、/forge-tokens）
tools/build-docs.mjs         从规则与配方生成 docs/ 手册
docs/                        生成的规则手册（GitHub Pages）
```

命令一览：

| 命令 | 用途 | 特点 |
|---|---|---|
| `/forge <需求>` | 建页面 / 改页面 / 任意设计任务 | 走完整流程（pre-flight → 问一次 → 配方 → 建 → 查） |
| `/forge-audit <目标>` | 只审查 | 只读，子代理运行，不改代码 |
| `/forge-redo <目标>` | 重做页面 | 先记录 links/字段/handler/标题，改完逐一比对 |
| `/forge-tokens [slug]` | 看/生成配方 token | 只出 token，不动页面 |

## 安装

```bash
git clone https://github.com/aifeifei798/design-forge.git
cd design-forge

node tools/link.mjs opencode   # 或 zcode / claude / codex / all
```

`tools/link.mjs` 只建符号链接（改仓库即生效），已存在的真实文件不覆盖；加 `--dry-run` 先看会动哪些路径。

- OpenCode 的搜索路径包含 `~/.agents/skills/`、`~/.config/opencode/skills/`、`~/.claude/skills/`、项目内 `.opencode/skills/`；放哪个都行，符号链接是为了改仓库即生效。
- ZCode 用 `~/.zcode/skills/` + `~/.zcode/commands/`，还要在 `~/.zcode/AGENTS.md` 加一段路由——见 [HARNESSES.md](HARNESSES.md)。
- 命令需要**新会话**才出现在 `/` 列表；skill 本身在下次会话被扫描到（也可以在会话内直接说"用 design-forge"）。
- 不想用符号链接就整目录复制，代价是每次更新要重拷。

## 用法

```bash
# 发牌
node skill/scripts/tokens.mjs deal --genre product

# 看某套配方
node skill/scripts/tokens.mjs show harbor

# 生成 token（Tailwind v4）
node skill/scripts/tokens.mjs emit harbor --tailwind --out src/app/forge-tokens.css

# 检查（静态）
node skill/scripts/forge.mjs src/

# 检查（八宽度渲染，先征得同意）
node skill/scripts/forge.mjs src/ --render

# 截图（落 .forge/shots/）
node skill/scripts/forge.mjs src/index.html --shots

# 规则目录（人读 / 机器读）
node skill/scripts/forge.mjs --list-rules
node skill/scripts/forge.mjs --list-rules --json

# 重新生成规则手册
node tools/build-docs.mjs
```

退出码：`0` 无 FAIL，`2` 有 FAIL，`1` 运行失败。可以直接当 CI 门禁。

## 自测

```bash
npm test       # bad 必须 18 FAIL/退出 2，good 必须 0，docs 必须 0
```

## 为什么自己攒

三家的规则内核高度重合（紫蓝渐变、eyebrow、卡片套卡片、`transition: all`、纯黑白、编造数据……），但各带一套自己的重物：48 个主题、22 MB Rust 引擎、遥测、24 个命令、几千行参考文档。重叠部分我们只需要一份，重物一个都不要。

这个项目的取舍：

| 要 | 不要 |
|---|---|
| 一份去重后的规则表 | 三家各说一遍 |
| 可执行的确定性检查器 | 只能"自觉遵守"的清单 |
| 8 套够用的配方 | 48 套 + 远端发牌 API |
| 纯 Node 脚本 | 二进制下载、遥测、hook 安装 |
| 中文规则与中文审查报告 | 英文长文档 |

## 许可

MIT。规则内核对以下项目的公开借鉴（概念层面，未复制源码）：**hallmark**（MIT，Nutlope / Together AI）、**impeccable**（Apache-2.0，Paul Bakaus）、**tailwind-design-system**（社区 skill）、**Tailwind CSS**（MIT）。逐条说明见 [NOTICE.md](NOTICE.md)。
