#!/usr/bin/env node
// design-forge · forge.mjs
// 确定性 UI 检查器。无依赖、无网络、无遥测。静态档永远先跑；--render 需要 puppeteer-core + Chrome。
//
//   node forge.mjs <file-or-dir...> [--json] [--render] [--shots]
//                  [--recipe <slug>] [--waive id,id] [--list-rules] [--no-fail]
//
// 退出码：0 无 FAIL；2 有 FAIL；1 运行失败。

import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

/* ------------------------------------------------------------------ 规则表 */

const RULES = {
  "color/literal": ["FAIL", "颜色没走 token", "把色值提进 :root / @theme 的 token 块，组件只引用 var(--x) 或语义类"],
  "color/pure-extreme": ["REFLEX", "纯黑或纯白", "往主体色的色相里偏一点（oklch 里降一点 L 或加一点 C）"],
  "tokens/missing": ["FAIL", "有颜色但没有 token 块", "加 :root 或 @theme，把所有色值集中声明"],
  "font/literal": ["REFLEX", "字体族写死在规则里", "字体也只走 token（--font-display / --font-body）"],
  "motion/transition-all": ["FAIL", "transition: all", "只过渡真正变化的属性：color、background-color、transform、opacity"],
  "motion/layout-property": ["FAIL", "过渡布局属性", "width/height/top/left 的过渡会掉帧，改用 transform"],
  "motion/no-reduced-motion": ["FAIL", "有动画但没有 reduced-motion 兜底", "加 @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important } }"],
  "motion/bounce-easing": ["REFLEX", "回弹缓动", "用指数型 ease-out，别用过冲曲线"],
  "layout/overflow-x-hidden": ["FAIL", "overflow-x: hidden", "用 overflow-x: clip，hidden 会把 sticky/滚动容器一起弄坏"],
  "layout/100vw": ["FAIL", "100vw", "100vw 在带滚动条的桌面会溢出，用 100% 或 dvw"],
  "layout/viewport-height": ["REFLEX", "100vh / h-screen", "移动端地址栏会跳，首屏用 100svh 或 dvh"],
  "a11y/html-lang": ["FAIL", "<html> 没有 lang", "补 lang=\"zh-CN\" 之类"],
  "a11y/img-alt": ["FAIL", "<img> 没有 alt", "装饰图 alt=\"\"，内容图写清楚内容"],
  "a11y/heading-skip": ["FAIL", "标题层级跳级", "h1 → h2 → h3，不跳级"],
  "a11y/focus-visible": ["FAIL", "项目里没有 :focus-visible", "给所有可交互元素加 focus-visible 环，且不做延迟"],
  "a11y/outline-none": ["REFLEX", "outline: none 没有替代焦点样式", "用 focus-visible:ring / :focus-visible { outline: 2px } 代替"],
  "a11y/input-label": ["REFLEX", "输入框没有可访问名称", "加 <label for> 或 aria-label"],
  "slop/purple-blue-gradient": ["FAIL", "紫→蓝渐变", "换掉；强调靠权重、尺寸或一个真实色块"],
  "slop/eyebrow": ["FAIL", "标题上方的 eyebrow / 逐字间距小标签", "删掉那行标签，让标题自己扛"],
  "slop/side-accent-border": ["REFLEX", "卡片/提示条上的彩色侧边线", "用背景色分层或留白，不要 1px 以上的侧边条"],
  "slop/hard-shadow": ["REFLEX", "零模糊硬阴影", "只有配方声明了硬阴影才用，否则用带偏移和模糊的柔和阴影"],
  "slop/nested-card": ["REFLEX", "卡片套卡片", "内层去掉边框/背景，用排版分层"],
  "slop/gradient-text": ["REFLEX", "渐变文字", "强调用字重或字号"],
  "slop/emoji": ["WARN", "emoji 当图形用", "换成真实图标或干脆不要图标"],
  "type/tiny-text": ["REFLEX", "小于 12px 的文字", "正文最小 14px，说明文字最小 12px"],
  "type/measure": ["REFLEX", "正文行宽超过 78ch", "正文 measure 控制在 65–75ch"],
  "craft/important": ["WARN", "!important 过多", "提高选择器特异性或用 @layer"],
  "craft/z-index": ["WARN", "z-index 用大整数", "建立 0–50 的层级 token"],
  "render/overflow-x": ["FAIL", "渲染后出现横向溢出", "找出溢出元素，改 minmax(0,1fr) / overflow-wrap / 缩小固定宽度"],
  "render/console-error": ["FAIL", "控制台报错", "先修错误再谈视觉"],
  "render/no-puppeteer": ["WARN", "渲染档不可用", "npm i -g puppeteer-core 并提供 Chrome"],
};

const TIER_ORDER = { FAIL: 0, REFLEX: 1, WARN: 2 };

/* ---------------------------------------------------------------- 参数解析 */

const argv = process.argv.slice(2);
const targets = [];
let json = false, render = false, shots = false, noFail = false, listRules = false;
let recipeSlug = null, waives = new Set();

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--json") json = true;
  else if (a === "--render") render = true;
  else if (a === "--shots") { render = true; shots = true; }
  else if (a === "--no-fail") noFail = true;
  else if (a === "--list-rules") listRules = true;
  else if (a === "--recipe") recipeSlug = argv[++i];
  else if (a === "--waive") String(argv[++i] || "").split(",").filter(Boolean).forEach((x) => waives.add(x.trim()));
  else if (a.startsWith("--")) { console.error(`forge: unknown flag ${a}`); process.exit(1); }
  else targets.push(a);
}

if (listRules) {
  if (json) {
    console.log(JSON.stringify({
      count: Object.keys(RULES).length,
      rules: Object.entries(RULES).map(([id, [tier, title, fix]]) => ({ id, tier, title, fix })),
    }, null, 2));
  } else {
    for (const [id, [tier, title, fix]] of Object.entries(RULES)) {
      console.log(`${tier.padEnd(6)} ${id.padEnd(26)} ${title}\n       fix: ${fix}`);
    }
  }
  process.exit(0);
}

if (targets.length === 0) {
  console.error("usage: node forge.mjs <file-or-dir...> [--json] [--render] [--shots] [--recipe <slug>] [--waive id,id]");
  process.exit(1);
}

/* -------------------------------------------------------------- 文件收集 */

const EXTS = new Set([".html", ".htm", ".css", ".jsx", ".tsx", ".vue", ".svelte", ".astro"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "coverage", ".git", ".forge", ".next", ".nuxt", ".svelte-kit", "vendor"]);

function collect(path, acc) {
  let st;
  try { st = statSync(path); } catch { return acc; }
  if (st.isDirectory()) {
    let entries = [];
    try { entries = readdirSync(path); } catch { return acc; }
    for (const name of entries) {
      if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
      collect(join(path, name), acc);
    }
  } else if (EXTS.has(extname(path).toLowerCase())) {
    acc.push(path);
  }
  return acc;
}

const files = [];
for (const t of targets) collect(resolve(t), files);

if (files.length === 0) {
  console.error("forge: no .html .css .jsx .tsx .vue .svelte .astro files found");
  process.exit(1);
}

/* ------------------------------------------------------------------ 工具 */

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

function tokenRanges(text) {
  // :root { ... } / @theme { ... } / [data-theme] { ... } / .dark { ... } 的字符区间
  const ranges = [];
  const re = /(:root|@theme|\[data-theme[^\]]*\]|\.dark)\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length - 1;
    let depth = 0;
    for (; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") { depth--; if (depth === 0) break; }
    }
    ranges.push([m.index, i]);
  }
  return ranges;
}

const inRanges = (ranges, i) => ranges.some(([s, e]) => i >= s && i <= e);

// 标记语言里只检查"代码"：标签（含 class/style 等属性）与 <style> 块；
// 标签之间的自然语言正文不是代码，不做规则扫描（否则文档页会被自己误杀）。
function codeOnlyProjection(text) {
  const ranges = [];
  for (const m of text.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)) ranges.push([m.index, m.index + m[0].length]);
  for (const m of text.matchAll(/<[a-zA-Z/!][^>]*>/g)) ranges.push([m.index, m.index + m[0].length]);
  ranges.sort((a, b) => a[0] - b[0]);
  let out = "", cursor = 0;
  for (const [s, e] of ranges) {
    if (s < cursor) continue;
    out += text.slice(cursor, s).replace(/[^\n]/g, " ");
    out += text.slice(s, e);
    cursor = e;
  }
  out += text.slice(cursor).replace(/[^\n]/g, " ");
  return out;
}

function classAttrs(text) {
  const out = [];
  const re = /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{["'`]([^"'`]*)["'`]\})/g;
  let m;
  while ((m = re.exec(text))) out.push({ value: m[1] ?? m[2] ?? m[3] ?? m[4] ?? "", index: m.index });
  return out;
}

const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)|\boklch\([^)]*\)/g;

function isExtreme(literal) {
  const v = literal.toLowerCase();
  if (/^#(fff|ffffff)$/.test(v) || /^#(000|000000)$/.test(v)) return true;
  if (v.startsWith("oklch(")) {
    const m = v.match(/oklch\(\s*([\d.]+)%?\s+(?:[\d.]+\s+)?([\d.]+)?/);
    if (m) {
      const l = parseFloat(m[1]);
      const c = parseFloat(m[2] ?? "0");
      if ((l >= 99 || l <= 1) && (c === 0 || Number.isNaN(c))) return true;
    }
  }
  if (v.startsWith("rgb(255, 255, 255") || v.startsWith("rgb(0, 0, 0")) return true;
  return false;
}

/* --------------------------------------------------------------- 项目级事实 */

const source = new Map();
for (const f of files) source.set(f, readFileSync(f, "utf8"));

const allCss = files
  .filter((f) => [".css", ".html", ".htm", ".vue", ".svelte", ".astro"].includes(extname(f).toLowerCase()))
  .map((f) => source.get(f))
  .join("\n");

const hasFocusVisible = /:focus-visible/.test(allCss);
const hasTokenBlock = files.some((f) => tokenRanges(source.get(f)).length > 0);
const hasInteractive = /<(button|a\s|input|select|textarea)\b|role=["']button["']/.test(
  files.map((f) => source.get(f)).join("\n"),
);

/* ------------------------------------------------------------------ 检查 */

const findings = [];
const add = (file, id, index, message, override) => {
  const [tier, , fix] = RULES[id];
  findings.push({
    file,
    id,
    tier: override?.tier ?? tier,
    line: index == null ? null : lineOf(source.get(file) ?? "", index),
    message: override?.message ?? message,
    fix: override?.fix ?? fix,
  });
};

for (const file of files) {
  const text = source.get(file);
  const ext = extname(file).toLowerCase();
  const isMarkup = [".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte", ".astro"].includes(ext);
  const code = isMarkup ? codeOnlyProjection(text) : text;
  const ranges = tokenRanges(code);
  const classes = classAttrs(code);

  /* --- 颜色 token --- */
  if (ext === ".css" || isMarkup) {
    let m;
    COLOR_RE.lastIndex = 0;
    while ((m = COLOR_RE.exec(code))) {
      if (inRanges(ranges, m.index)) continue;
      const lit = m[0];
      if (isExtreme(lit)) add(file, "color/pure-extreme", m.index, `pure ${lit}`);
      else add(file, "color/literal", m.index, `${lit} outside tokens`);
    }
  }
  if (isMarkup) {
    // Tailwind 任意色值：bg-[#fff] / text-[oklch(...)]
    const arb = /(?:bg|text|border|ring|fill|stroke|from|via|to|shadow|divide|outline|accent|caret|decoration)-\[(#[0-9a-fA-F]{3,8}|rgba?\([^\]]*\)|oklch\([^\]]*\)|hsla?\([^\]]*\))\]/g;
    let m;
    while ((m = arb.exec(code))) {
      if (isExtreme(m[1])) add(file, "color/pure-extreme", m.index, `pure ${m[1]} in arbitrary class`);
      else add(file, "color/literal", m.index, `arbitrary colour class ${m[0]}`);
    }
  }
  if ({ ".css": 1, ".html": 1, ".htm": 1 }[ext] && code.match(COLOR_RE) && !hasTokenBlock) {
    add(file, "tokens/missing", null, "page uses colours but the project has no :root / @theme token block");
  }
  if (ext === ".css") {
    const ff = /font-family\s*:\s*([^;]+);/g;
    let m;
    while ((m = ff.exec(code))) {
      if (inRanges(ranges, m.index)) continue;
      const value = m[1].trim();
      if (/^var\(/.test(value)) continue; // 已经是 token 引用
      if (/^(inherit|initial|unset|revert|inherit)$/.test(value)) continue;
      add(file, "font/literal", m.index, `font-family: ${value}`);
    }
  }

  /* --- 动效 --- */
  let m;
  const tall = /transition\s*:\s*all\b|transition-all\b/g;
  while ((m = tall.exec(code))) add(file, "motion/transition-all", m.index, m[0].trim());
  const tlayout = /transition(?:-property)?\s*:[^;]*\b(width|height|top|left|right|bottom|margin|padding|inset)\b/g;
  while ((m = tlayout.exec(code))) add(file, "motion/layout-property", m.index, m[0].trim());
  const hasAnim = /@keyframes|animation\s*:|animate-/.test(code);
  if (hasAnim && !/prefers-reduced-motion/.test(code)) {
    add(file, "motion/no-reduced-motion", code.search(/@keyframes|animation\s*:|animate-/), "animation without reduced-motion fallback");
  }
  const bounce = /cubic-bezier\(\s*[\d.]+\s*,\s*(-[\d.]+|[1-9][\d.]*)\s*,/g;
  while ((m = bounce.exec(code))) add(file, "motion/bounce-easing", m.index, `overshoot easing ${m[0]}`);
  const bounceKw = /\b(bounce|elastic)\b.*(ease|timing)|ease-\[?bounce/g;
  while ((m = bounceKw.exec(code))) add(file, "motion/bounce-easing", m.index, m[0].trim());

  /* --- 布局 --- */
  const oxh = /overflow-x\s*:\s*hidden|overflow-x-hidden/g;
  while ((m = oxh.exec(code))) add(file, "layout/overflow-x-hidden", m.index, m[0].trim());
  const vw = /\b100vw\b/g;
  while ((m = vw.exec(code))) add(file, "layout/100vw", m.index, "100vw");
  const vh = /\b100vh\b|min-h-screen|\bh-screen\b/g;
  while ((m = vh.exec(code))) add(file, "layout/viewport-height", m.index, m[0].trim());

  /* --- a11y --- */
  if (isMarkup) {
    const htmlTag = /<html\b[^>]*>/i.exec(text);
    if (htmlTag && !/\blang\s*=/.test(htmlTag[0])) add(file, "a11y/html-lang", htmlTag.index, "<html> without lang");
    const img = /<img\b[^>]*>/gi;
    while ((m = img.exec(text))) if (!/\balt\s*=/.test(m[0])) add(file, "a11y/img-alt", m.index, m[0].slice(0, 60));
    const heads = [...text.matchAll(/<h([1-6])\b/gi)].map((x) => ({ level: Number(x[1]), index: x.index }));
    let prev = 0;
    for (const h of heads) {
      if (prev && h.level > prev + 1) add(file, "a11y/heading-skip", h.index, `h${prev} → h${h.level}`);
      prev = h.level;
    }
    const inputs = /<(input|select|textarea)\b[^>]*>/gi;
    while ((m = inputs.exec(text))) {
      const tag = m[0];
      if (/\btype=["'](hidden|submit|button)["']/i.test(tag)) continue;
      const named = /\b(id|aria-label|aria-labelledby)\s*=/.test(tag);
      if (!named) add(file, "a11y/input-label", m.index, tag.slice(0, 60));
    }
  }
  if (hasInteractive && !hasFocusVisible) {
    add(file, "a11y/focus-visible", null, "interactive elements exist but no :focus-visible anywhere in the project");
  }
  const outnone = /outline\s*:\s*none|\boutline-none\b/g;
  while ((m = outnone.exec(code))) {
    const windowText = code.slice(Math.max(0, m.index - 200), m.index + 200);
    if (!/focus-visible/.test(windowText)) add(file, "a11y/outline-none", m.index, m[0].trim());
  }

  /* --- slop --- */
  const grad = /linear-gradient\(([^)]*)\)/gi;
  while ((m = grad.exec(code))) {
    const body = m[1].toLowerCase();
    if (/(purple|violet|indigo|fuchsia|magenta)/.test(body) && /(blue|cyan|indigo|violet)/.test(body)) {
      add(file, "slop/purple-blue-gradient", m.index, "purple→blue gradient");
    }
  }
  for (const c of classes) {
    const v = c.value;
    if (/\bfrom-(purple|violet|indigo|fuchsia)\b/.test(v) && /\bto-(blue|indigo|cyan|violet)\b/.test(v)) {
      add(file, "slop/purple-blue-gradient", c.index, v.trim().slice(0, 80));
    }
    if (/\buppercase\b/.test(v) && /\btracking-(wide|wider|widest|\[)/.test(v) && /\btext-(xs|\[(9|10|11)px\])/.test(v)) {
      add(file, "slop/eyebrow", c.index, `eyebrow combo: ${v.trim().slice(0, 70)}`);
    }
    if (/\bborder-[lr]-\[?[2-9]px\]?/.test(v)) add(file, "slop/side-accent-border", c.index, v.trim().slice(0, 70));
    if (/\bshadow-\[[^\]]*_0(?:\]|_)/.test(v)) add(file, "slop/hard-shadow", c.index, v.trim().slice(0, 70));
    if (/\bbg-clip-text\b/.test(v) && /\btext-transparent\b/.test(v)) add(file, "slop/gradient-text", c.index, "gradient text");
    if (/\btext-\[(9|10|11)px\]/.test(v)) add(file, "type/tiny-text", c.index, v.match(/text-\[\d+px\]/)[0]);
  }
  const eyebrowCss = /letter-spacing\s*:\s*0?\.(0[5-9]|[1-9])[0-9]*em[^}]*\}[^{]*\{[^}]*text-transform\s*:\s*uppercase|text-transform\s*:\s*uppercase[^}]*letter-spacing\s*:\s*0?\.(0[5-9]|[1-9])/g;
  while ((m = eyebrowCss.exec(code))) add(file, "slop/eyebrow", m.index, "uppercase + tracked letters in CSS");
  const sideBorder = /border-(?:left|right)\s*:\s*[2-9]px/g;
  while ((m = sideBorder.exec(code))) add(file, "slop/side-accent-border", m.index, m[0]);
  const hardShadow = /box-shadow\s*:\s*(?:inset\s+)?\d+px\s+\d+px\s+0(?:px)?(?![.\d])/g;
  while ((m = hardShadow.exec(code))) add(file, "slop/hard-shadow", m.index, m[0]);
  if (ext === ".css") {
    // 卡片套卡片（后代写法）：.card .inner-card / .card__body .card
    const descRe = /([^{};]*)\{/g;
    let dm;
    while ((dm = descRe.exec(code))) {
      const sel = dm[1].trim();
      const parts = sel.split(/[\s>+~]+/).filter((s) => /card/i.test(s));
      if (parts.length >= 2) add(file, "slop/nested-card", dm.index, `nested card selector: ${sel.slice(0, 60)}`);
    }
    // 卡片套卡片（嵌套写法）：选择器里出现 card，且嵌套在另一个含 card 的规则内
    const stack = [];
    let depth = 0, idx = 0;
    while (idx < text.length) {
      const open = text.indexOf("{", idx);
      const close = text.indexOf("}", idx);
      if (open === -1 && close === -1) break;
      if (open !== -1 && (close === -1 || open < close)) {
        const sel = text.slice(idx, open).split(";").pop().trim();
        stack.push(/card/i.test(sel) ? "card" : "other");
        if (stack.filter((x) => x === "card").length >= 2) {
          add(file, "slop/nested-card", open, `nested card: ${sel.slice(-50)}`);
        }
        idx = open + 1;
      } else {
        stack.pop();
        idx = close + 1;
      }
    }
  }
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
  while ((m = emoji.exec(text))) add(file, "slop/emoji", m.index, `emoji ${m[0]}`);

  /* --- 排版 --- */
  const tiny = /font-size\s*:\s*([0-9.]+)px/g;
  while ((m = tiny.exec(code))) if (parseFloat(m[1]) < 12) add(file, "type/tiny-text", m.index, m[0]);
  const fontShorthand = /\bfont\s*:\s*(?:[a-z]+\s+)?([0-9.]+)px/g;
  while ((m = fontShorthand.exec(code))) if (parseFloat(m[1]) < 12) add(file, "type/tiny-text", m.index, m[0]);
  const measureRe = /max-width\s*:\s*(\d+)ch/g;
  while ((m = measureRe.exec(code))) if (Number(m[1]) > 78) add(file, "type/measure", m.index, m[0]);
  const important = (code.match(/!important/g) || []).length;
  if (important > 3) add(file, "craft/important", code.search(/!important/), `${important}× !important`);
  const zRe = /z-index\s*:\s*(\d{4,})/g;
  while ((m = zRe.exec(code))) add(file, "craft/z-index", m.index, m[0]);

  /* 配方豁免：quarry 允许硬阴影 */
  if (recipeSlug === "quarry") {
    for (const f of findings) if (f.id === "slop/hard-shadow") f.tier = "WARN";
  }
}

/* ------------------------------------------------------------ 渲染档（可选） */

let renderReport = null;

async function runRender() {
  const { createRequire } = await import("node:module");
  const tryRoots = async (roots) => {
    for (const root of roots) {
      for (const name of ["puppeteer-core", "puppeteer"]) {
        try {
          const req = createRequire(join(root, "noop.js"));
          const resolved = req.resolve(name);
          const mod = await import(`file://${resolved}`);
          if (mod.default) return mod.default;
        } catch {}
      }
    }
    return null;
  };
  let puppeteer = null;
  const localRoots = [process.cwd(), dirname(new URL(import.meta.url).pathname)];
  if (process.env.HALLMARK_PUPPETEER) localRoots.unshift(process.env.HALLMARK_PUPPETEER);
  if (process.env.FORGE_PUPPETEER) localRoots.unshift(process.env.FORGE_PUPPETEER);
  puppeteer = await tryRoots(localRoots);
  if (!puppeteer) {
    try {
      const { execSync } = await import("node:child_process");
      const g = execSync("npm root -g", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      if (g) puppeteer = await tryRoots([dirname(g)]);
    } catch {}
  }
  if (!puppeteer) {
    renderReport = { skipped: "no puppeteer-core found (npm i -g puppeteer-core)" };
    findings.push({ file: "(render)", id: "render/no-puppeteer", tier: "WARN", line: null, message: "render tier unavailable", fix: RULES["render/no-puppeteer"][2] });
    return;
  }
  const { existsSync } = await import("node:fs");
  const chrome =
    [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
      .find((p) => p && existsSync(p)) ||
    (typeof puppeteer.executablePath === "function" ? puppeteer.executablePath() : null);
  if (!chrome) {
    renderReport = { skipped: "no Chrome found (set CHROME_PATH)" };
    return;
  }

  const pages = files.filter((f) => [".html", ".htm"].includes(extname(f).toLowerCase()));
  if (pages.length === 0) {
    renderReport = { skipped: "no .html files to render" };
    return;
  }

  const widths = [360, 390, 768, 1024, 1280, 1440, 1920, 2560];
  const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
  renderReport = { pages: [] };
  try {
    for (const page of pages) {
      const rec = { file: page, widths: {}, overflow: [], errors: [] };
      const tab = await browser.newPage();
      tab.on("pageerror", (e) => rec.errors.push(String(e.message).split("\n")[0]));
      await tab.goto(`file://${page}`, { waitUntil: "load" });
      for (const w of widths) {
        await tab.setViewport({ width: w, height: 900 });
        await new Promise((r) => setTimeout(r, 120));
        const info = await tab.evaluate(() => {
          const de = document.documentElement;
          const over = de.scrollWidth - de.clientWidth;
          const offenders = [];
          if (over > 1) {
            for (const el of document.querySelectorAll("body *")) {
              const r = el.getBoundingClientRect();
              if (r.right > de.clientWidth + 1 && r.width > 24) {
                offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} → ${Math.round(r.right)}px`);
                if (offenders.length >= 4) break;
              }
            }
          }
          return { over, offenders };
        });
        rec.widths[w] = info.over;
        if (info.over > 1) {
          rec.overflow.push({ width: w, over: info.over, offenders: info.offenders });
        }
      }
      if (rec.overflow.length) {
        const first = rec.overflow[0];
        findings.push({
          file: page,
          id: "render/overflow-x",
          tier: "FAIL",
          line: null,
          message: `orizontal overflow at ${rec.overflow.map((o) => o.width + "px").join(", ")} (first: +${first.over}px)${first.offenders.length ? " · " + first.offenders.join(" | ") : ""}`,
          fix: RULES["render/overflow-x"][2],
        });
      }
      for (const e of rec.errors) {
        findings.push({ file: page, id: "render/console-error", tier: "FAIL", line: null, message: e, fix: RULES["render/console-error"][2] });
      }
      if (shots) {
        const dir = join(dirname(page), ".forge", "shots");
        mkdirSync(dir, { recursive: true });
        await tab.setViewport({ width: 1440, height: 900 });
        await tab.screenshot({ path: join(dir, `${basename(page, extname(page))}-1440.png`), fullPage: true });
        await tab.setViewport({ width: 390, height: 844 });
        await tab.screenshot({ path: join(dir, `${basename(page, extname(page))}-390.png`), fullPage: true });
        rec.shots = join(dir, `${basename(page, extname(page))}-{390,1440}.png`);
      }
      renderReport.pages.push(rec);
      await tab.close();
    }
  } finally {
    await browser.close();
  }
}

if (render) await runRender();

/* ------------------------------------------------------------------ 输出 */

const waived = findings.filter((f) => waives.has(f.id));
const active = findings.filter((f) => !waives.has(f.id));
active.sort((a, b) => (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) || a.file.localeCompare(b.file) || (a.line ?? 0) - (b.line ?? 0));

const summary = {
  files: files.length,
  fail: active.filter((f) => f.tier === "FAIL").length,
  reflex: active.filter((f) => f.tier === "REFLEX").length,
  warn: active.filter((f) => f.tier === "WARN").length,
  waived: waived.length,
};

if (json) {
  console.log(JSON.stringify({ summary, findings: active, waived, render: renderReport }, null, 2));
} else {
  let current = null;
  for (const f of active) {
    if (f.file !== current) { current = f.file; console.log(`\n${f.file}`); }
    const where = f.line ? `:${f.line}` : "—";
    console.log(`  ${f.tier.padEnd(6)} ${f.id.padEnd(27)} ${where.padEnd(8)} ${f.message}`);
  }
  if (waived.length) console.log(`\nwaived: ${waived.map((w) => w.id).join(", ")}`);
  if (renderReport?.pages) {
    console.log(`\nrender: ${renderReport.pages.map((p) => `${basename(p.file)} ${Object.entries(p.widths).map(([w, o]) => w + (o > 1 ? "✗" : "✓")).join(" ")}`).join("\n        ")}`);
  } else if (renderReport?.skipped) {
    console.log(`\nrender: skipped — ${renderReport.skipped}`);
  }
  console.log(`\n${summary.fail} FAIL · ${summary.reflex} REFLEX · ${summary.warn} WARN · ${summary.waived} waived · ${summary.files} file(s)`);
}

if (!noFail && summary.fail > 0) process.exit(2);
