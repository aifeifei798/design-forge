---
description: design-forge · 建页面 / 改页面（完整流程：定型 → 配方 → 建 → 查）
argument-hint: "[需求描述]"
skills: design-forge
---
Use the `design-forge` skill (load it first) and follow its SKILL.md flow for this request:

$ARGUMENTS

If the argument is empty, ask what to build (page type, audience, the one action) and wait.

Rules for this run:
- Always run the static check before reporting: `node <skill-dir>/scripts/forge.mjs <target>`; paste the real summary, never a hand-written number.
- Ask once before `--render` / `--shots` (screenshot policy). Never claim a render pass you did not run.
- Load only the references you need (floor + craft + tailwind, plus states/audit when relevant).
- Facts are not invented: no number, quote, logo or testimonial without a source.
