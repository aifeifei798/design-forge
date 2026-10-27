---
description: design-forge · 只审查不改代码（Floor/Reflex/Finish 分档报告）
subtask: true
---
Load the `design-forge` skill, then run its **audit** path — read `~/.agents/skills/design-forge/references/audit.md` and `~/.agents/skills/design-forge/references/floor.md`.

Target: $ARGUMENTS
If $ARGUMENTS is empty, audit the current directory's UI entry points and say which files you picked.

Rules for this run:
- Read-only: do not modify any file, do not create tokens, do not reformat.
- Run `node ~/.agents/skills/design-forge/scripts/forge.mjs <target> --json` first and paste the real `summary`.
- Do not run `--render` / `--shots` (no browser).
- Report in the audit.md format: Floor (must fix) / Reflex (should fix) / Finish (record only) / next steps, each item with `file:line`.
- Facts are not inferred: if a number, quote or logo has no source, say it is invented rather than guessing.
