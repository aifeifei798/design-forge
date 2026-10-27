#!/usr/bin/env node
// design-forge · tokens.mjs
// 视觉配方发牌与 token 生成。无依赖、无网络、无遥测。
//
//   node tokens.mjs recipes
//   node tokens.mjs deal [--genre editorial|technical|soft|luxury|playful|brutalist|product|dark] [--seed <s>] [--n 3]
//   node tokens.mjs show <slug>
//   node tokens.mjs emit <slug> [--tailwind] [--density compact|normal|airy] [--out <file>] [--fonts]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "data", "recipes.json");
const { recipes } = JSON.parse(readFileSync(DATA, "utf8"));

const argv = process.argv.slice(2);
const cmd = argv[0];
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
};
const has = (name) => argv.includes(`--${name}`);
const die = (msg) => { console.error(`tokens: ${msg}`); process.exit(2); };

const oklch = ({ l, c, h }) => `oklch(${l}% ${c} ${h})`;

const densityScale = { compact: 0.8, normal: 1, airy: 1.25 };

function find(slug) {
  const r = recipes.find((x) => x.slug === slug);
  if (!r) die(`unknown recipe "${slug}". known: ${recipes.map((r) => r.slug).join(", ")}`);
  return r;
}

// 确定性伪随机：种子相同 → 发牌相同，方便复现和写进状态文件
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function deal() {
  const genre = flag("genre", null);
  const n = Number(flag("n", 3));
  const seed = String(flag("seed", `${genre || "any"}-${Date.now().toString(36)}`));
  const pool = recipes.filter((r) => !genre || r.genre === genre);
  if (pool.length === 0) die(`no recipe for genre "${genre}"`);
  const rnd = seeded(seed);
  const picked = [...pool].sort(() => rnd() - 0.5).slice(0, Math.min(n, pool.length));
  console.log(`deal: ${seed} · ${genre || "any"} · ${picked.length}/${pool.length}`);
  picked.forEach((r, i) => {
    const axes = `${r.paper.l > 60 ? "light" : "dark"}/${r.displayClass}/${r.density}`;
    console.log(`${i + 1}. ${r.name} (${r.slug}) · ${axes} · ${r.mood}`);
    console.log(`   signature: ${r.signature}`);
  });
  console.log(`next: node tokens.mjs show <slug> · node tokens.mjs emit <slug> --tailwind --out tokens.css`);
}

function show(slug) {
  const r = find(slug);
  const lines = [
    `${r.name} (${r.slug}) · genre ${r.genre} · density ${r.density}`,
    `mood: ${r.mood}`,
    `paper ${oklch(r.paper)}  ink ${oklch(r.ink)}  muted ${oklch(r.muted)}`,
    `accent ${oklch(r.accent)}  border ${oklch(r.border)}`,
    `fonts: display ${r.fonts.display} / body ${r.fonts.body} / mono ${r.fonts.mono}`,
    `radius: ${Object.entries(r.radius).map(([k, v]) => `${k}=${v}`).join(" ")}`,
    `motion: ${r.motion.duration} ${r.motion.curve}`,
    `signature: ${r.signature}`,
    `do: ${r.do.join(" / ")}`,
    `dont: ${r.dont.join(" / ")}`,
    `hard shadow allowed: ${r.hardShadow ? "yes" : "no"}`,
  ];
  console.log(lines.join("\n"));
}

function emit(slug) {
  const r = find(slug);
  const density = String(flag("density", r.density));
  const k = densityScale[density] ?? 1;
  const px = (n) => `${Math.round(n * k)}px`;
  const tailwind = has("tailwind");

  const colors = {
    paper: oklch(r.paper),
    ink: oklch(r.ink),
    muted: oklch(r.muted),
    accent: oklch(r.accent),
    border: oklch(r.border),
  };

  const body = tailwind
    ? `@theme {
  /* design-forge · ${r.name} · ${r.slug} */
  --color-paper: ${colors.paper};
  --color-ink: ${colors.ink};
  --color-muted: ${colors.muted};
  --color-accent: ${colors.accent};
  --color-border: ${colors.border};

  --font-display: "${r.fonts.display}", ui-serif, Georgia, serif;
  --font-body: "${r.fonts.body}", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "${r.fonts.mono}", ui-monospace, monospace;

  --radius-sm: ${r.radius.sm};
  --radius-md: ${r.radius.md};
  --radius-lg: ${r.radius.lg};
  --radius-pill: ${r.radius.pill};

  --ease-forge: ${r.motion.curve};
  --duration-forge: ${r.motion.duration};

  --space-1: ${px(4)};
  --space-2: ${px(8)};
  --space-3: ${px(12)};
  --space-4: ${px(16)};
  --space-6: ${px(24)};
  --space-8: ${px(32)};
  --space-12: ${px(48)};
  --space-16: ${px(64)};
  --space-24: ${px(96)};
  --space-section: ${px(96)};
}
`
    : `/* design-forge · ${r.name} · ${r.slug} · generated, edit the recipe not this file */
:root {
  --paper: ${colors.paper};
  --ink: ${colors.ink};
  --muted: ${colors.muted};
  --accent: ${colors.accent};
  --border: ${colors.border};

  --font-display: "${r.fonts.display}", ui-serif, Georgia, serif;
  --font-body: "${r.fonts.body}", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "${r.fonts.mono}", ui-monospace, monospace;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 20px;
  --text-xl: 26px;
  --text-2xl: 34px;
  --text-3xl: clamp(40px, 5vw, 64px);
  --text-display: clamp(52px, 7vw, 104px);

  --radius-sm: ${r.radius.sm};
  --radius-md: ${r.radius.md};
  --radius-lg: ${r.radius.lg};
  --radius-pill: ${r.radius.pill};

  --ease-forge: ${r.motion.curve};
  --duration-forge: ${r.motion.duration};

  --space-1: ${px(4)};
  --space-2: ${px(8)};
  --space-3: ${px(12)};
  --space-4: ${px(16)};
  --space-6: ${px(24)};
  --space-8: ${px(32)};
  --space-12: ${px(48)};
  --space-16: ${px(64)};
  --space-24: ${px(96)};
  --space-section: ${px(96)};

  --shadow-soft: 0 1px 2px oklch(0% 0 0 / 0.06), 0 8px 24px oklch(0% 0 0 / 0.08);
  --shadow-hard: 4px 4px 0 var(--ink);${r.hardShadow ? "\n  /* hardShadow allowed in this recipe */" : ""}

  --measure: 66ch;
  --container: 1200px;
}
`;

  const out = flag("out", null);
  if (out) {
    mkdirSync(dirname(String(out)), { recursive: true });
    writeFileSync(String(out), body);
    console.log(`wrote ${out} (${r.slug}${tailwind ? ", tailwind" : ""}, density ${density})`);
  } else {
    process.stdout.write(body);
  }

  if (has("fonts")) {
    const fams = [r.fonts.display, r.fonts.body, r.fonts.mono]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600`)
      .join("&");
    console.log(`\n<!-- fonts: self-host preferred; else <link href="https://fonts.googleapis.com/css2?${fams}&display=swap" rel="stylesheet"> -->`);
  }
}

if (!cmd || cmd === "--help" || cmd === "-h") {
  console.log(`design-forge tokens
  recipes
  deal [--genre <g>] [--seed <s>] [--n 3]
  show <slug>
  emit <slug> [--tailwind] [--density compact|normal|airy] [--out <file>] [--fonts]`);
} else if (cmd === "recipes") {
  for (const r of recipes) console.log(`${r.slug.padEnd(10)} ${r.genre.padEnd(11)} ${r.name.padEnd(12)} ${r.mood}`);
} else if (cmd === "deal") {
  deal();
} else if (cmd === "show") {
  show(argv[1] ?? die("show <slug>"));
} else if (cmd === "emit") {
  emit(argv[1] ?? die("emit <slug>"));
} else {
  die(`unknown command "${cmd}"`);
}
