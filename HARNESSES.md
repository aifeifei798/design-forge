# 各 harness 安装与差异

design-forge 是纯 Markdown + Node 脚本，所以每个 harness 都能用，差别只在**发现目录**、**调用方式**和**上下文预算**。

## 一张表

| Harness | Skill 目录 | 命令目录 | 调用方式 | 备注 |
|---|---|---|---|---|
| **OpenCode** | `~/.agents/skills/`（也读 `~/.config/opencode/skills/`、`~/.claude/skills/`、项目 `.opencode/skills/`） | `~/.config/opencode/commands/` | 自动触发；`/forge`、`/forge-audit`、`/forge-redo`、`/forge-tokens` | 命令 frontmatter 认 `description` / `agent` / `subtask`；`subtask: true` 可让命令跑在子代理里 |
| **ZCode** | `~/.zcode/skills/<name>/SKILL.md` | `~/.zcode/commands/*.md` | 自动触发；`$design-forge`；`/forge-*` | 描述注入截断到 250 字符（所以触发词写在最前面）；正文 >100KB 会被截断；命令 frontmatter 认 `description` / `argument-hint` / `skills`（可直接挂载技能） |
| **Claude Code** | `~/.claude/skills/` | `~/.claude/commands/` | 自动触发；`/forge-*` | 与 OpenCode 同一套命令文件可用 |
| **Codex CLI** | `~/.agents/skills/` | 无 commands 约定 | `$design-forge` | 只有 skill，没有斜杠命令 |

## 安装

```bash
git clone https://github.com/aifeifei798/design-forge.git
cd design-forge

node tools/link.mjs opencode     # 或 zcode / claude / codex / all
node tools/link.mjs zcode --dry-run   # 先看会建哪些链接
```

`tools/link.mjs` 只建符号链接（改仓库即生效），已存在的真实文件不会被覆盖。

## ZCode 额外两步

ZCode 有三件事跟 OpenCode 不同，装完补上：

### 1. 全局指令（`~/.zcode/AGENTS.md`）

ZCode 读 `~/.zcode/AGENTS.md`（全局）+ `<workspace>/AGENTS.md`（项目）。把这段放进去，让它在没触发描述时也能想起来：

```markdown
## design-forge

做/改网页、落地页、官网、产品页、仪表盘、UI 组件、配色排版动效、设计系统、审查界面时，
先用 `$design-forge` 加载技能，再动手。

- 静态检查：`node ~/.zcode/skills/design-forge/scripts/forge.mjs <目标>`（FAIL 必须清零）
- 渲染档 `--render` / 截图 `--shots`：先问我一次
- 交付里贴真实的 forge summary，不许手写数字
- 纯图片提示词（海报/写真）不归它，走 image-prompt-router
```

### 2. 技能太多会降级

ZCode 把**所有已启用技能**的名称 + 描述（每条最多 250 字符）注入上下文，共享一个固定预算。装太多技能时描述会被丢掉，只剩名字——自动触发率明显下降。

如果本地同时装了 20 个 image-prompt 技能，建议在 **设置 → 技能** 里只启用常用的；停用的技能不占预算、也不能被调用。

### 3. 斜杠命令

ZCode 的命令在 `~/.zcode/commands/*.md`，frontmatter 支持 `description` / `argument-hint` / `skills`。我们的命令文件三个字段都有，`skills: design-forge` 会让 ZCode 挂载技能，正文里的 `$ARGUMENTS` 接收参数。

## 上下文与脚本约束

- **单份 reference < 50KB**：OpenCode 上装了 context-mode 插件时，>50KB 的 Read 会被重定向到 ctx 工具；ZCode 上正文 >100KB 会被截断。两个阈值都是硬约束。
- **脚本用 shell 直接跑**：`forge.mjs` / `tokens.mjs` 输出 <2KB 且退出码（0/2）本身是门禁的一部分，不要塞进任何"沙箱执行"工具里。
- **无二进制、无遥测、不联网**：所以 `node` 在哪个 harness 里跑，行为都一样。

## 在 ZCode 里用 context-mode

ZCode 不跑 OpenCode 插件，`context-mode-opencode-v2` 那套 `Plugin.define` 包装层用不了。做法见 [context-mode-zcode](https://github.com/aifeifei798/context-mode-zcode)：

1. **常驻服务 + HTTP（推荐）**：`supergateway` 把 context-mode 的 stdio MCP 转成 Streamable HTTP，交给 `systemd --user` 常驻；ZCode 用 `{"type":"http","url":"http://127.0.0.1:8765/mcp"}` 连接。一条命令：`node install.mjs`。
2. **整套插件（实验性）**：context-mode 包自带 Claude 插件结构（`.claude-plugin/plugin.json` + `hooks/hooks.json`），ZCode 兼容 Claude 清单与 `${CLAUDE_PLUGIN_ROOT}`，可以作为本地市场插件装，能拿到 PreToolUse 拦截；但 matcher 与 ZCode 工具名的对应关系没有逐条验证。
3. **每次会话 stdio（兜底）**：让 ZCode 自己拉起 `node cli.bundle.mjs`，项目身份跟随工作区，但每个会话一个进程、各建索引。

常驻服务的三个语义差异：项目身份固定（`CONTEXT_MODE_PROJECT_DIR`）、知识库跨项目共享（`CONTEXT_MODE_DIR`）、没有 PreToolUse 拦截。
