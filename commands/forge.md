---
description: design-forge · 建页面 / 重做 / 审查（自建 UI 工作流）
---
Load the `design-forge` skill with the `skill` tool, then follow its SKILL.md flow for this request:

$ARGUMENTS

If $ARGUMENTS is empty, ask what to build (page type, audience, the one action) and wait.

Environment notes:
- Skill dir: `~/.agents/skills/design-forge` (symlink to the repo's `skill/`).
- Always run the static check first: `node ~/.agents/skills/design-forge/scripts/forge.mjs <target>`.
- Ask once before `--render` / `--shots` (local screenshot policy); never report a render result that was not actually run.
- Load only the references you need (floor + craft + tailwind, plus states/audit when relevant).
