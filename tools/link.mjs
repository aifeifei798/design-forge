#!/usr/bin/env node
// tools/link.mjs <opencode|zcode|claude|codex|all> [--dry-run]
// 把 skill 与命令链接到各 harness 的发现目录。只建/更新符号链接，不复制、不改配置。

import { existsSync, mkdirSync, rmSync, symlinkSync, lstatSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOME = homedir();
const dry = process.argv.includes("--dry-run");

const TARGETS = {
  opencode: {
    skill: join(HOME, ".agents", "skills", "design-forge"),
    commands: join(HOME, ".config", "opencode", "commands"),
  },
  zcode: {
    skill: join(HOME, ".zcode", "skills", "design-forge"),
    commands: join(HOME, ".zcode", "commands"),
  },
  claude: {
    skill: join(HOME, ".claude", "skills", "design-forge"),
    commands: join(HOME, ".claude", "commands"),
  },
  codex: {
    skill: join(HOME, ".agents", "skills", "design-forge"),
    commands: null, // Codex 用 $skill 调用，没有 commands 目录约定
  },
};

function link(from, to) {
  if (dry) { console.log(`[dry] ${to} -> ${from}`); return; }
  mkdirSync(dirname(to), { recursive: true });
  try {
    if (lstatSync(to).isSymbolicLink()) rmSync(to);
    else if (existsSync(to)) { console.log(`skip ${to} (real file exists)`); return; }
  } catch {}
  symlinkSync(from, to, "dir");
  console.log(`linked ${to} -> ${from}`);
}

const which = process.argv[2];
if (!which || !(which === "all" || TARGETS[which])) {
  console.error(`usage: node tools/link.mjs <${Object.keys(TARGETS).join("|")}|all> [--dry-run]`);
  process.exit(1);
}

for (const name of which === "all" ? Object.keys(TARGETS) : [which]) {
  const t = TARGETS[name];
  console.log(`\n# ${name}`);
  link(join(ROOT, "skill"), t.skill);
  if (!t.commands) continue;
  for (const file of ["forge.md", "forge-audit.md", "forge-redo.md", "forge-tokens.md"]) {
    link(join(ROOT, "commands", file), join(t.commands, file));
  }
}
