# 工程层：Tailwind CSS v4（CSS-first）

项目是 Tailwind v3 时先看 [迁移](#v3--v4-对照)，不要混用两套配置。

## 1. token 进 `@theme`

`tokens.mjs emit <slug> --tailwind` 直接产出这一段，写进样式入口（`app.css` / `globals.css`）的 `@import "tailwindcss";` 之后：

```css
@import "tailwindcss";

@theme {
  --color-paper: oklch(99% 0.003 250);
  --color-ink: oklch(25% 0.02 250);
  --color-muted: oklch(52% 0.02 250);
  --color-accent: oklch(55% 0.15 255);
  --color-border: oklch(92% 0.005 250);

  --font-display: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Instrument Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-md: 8px;
  --ease-forge: cubic-bezier(0.3, 0, 0.2, 1);
  --duration-forge: 150ms;
  --space-section: 96px;
}
```

`@theme` 里的名字自动生成工具类：`--color-accent` → `bg-accent` / `text-accent` / `border-accent`；`--font-display` → `font-display`；`--radius-md` → `rounded-md`。

**命名规则**：按语义命名（paper/ink/muted/accent/border），不要按颜色命名（blue-500）。换配方时类名不变，只换 token 值。

## 2. 暗色

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@layer base {
  :root { color-scheme: light; }
  [data-theme="dark"] {
    color-scheme: dark;
    --color-paper: oklch(16% 0.01 265);
    --color-ink: oklch(94% 0.008 80);
    --color-muted: oklch(70% 0.015 80);
    --color-border: oklch(28% 0.01 265);
  }
}
```

两个模式都要过对比度（Floor 1 只管 token，对比度靠人算）。不要在暗色里把所有颜色简单取反。

## 3. 组件变体（cva）

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 min-h-11 rounded-md font-medium " +
    "transition-[transform,background-color] duration-[var(--duration-forge)] ease-[var(--ease-forge)] " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
    "disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent text-paper hover:-translate-y-px",
        ghost: "text-ink hover:bg-border/40",
        outline: "border border-border text-ink hover:bg-border/30",
      },
      size: { sm: "min-h-9 px-3 text-sm", md: "px-5 text-base", lg: "min-h-12 px-7 text-lg" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = VariantProps<typeof button> & React.ComponentProps<"button">;
export const Button = ({ variant, size, className, ...props }: ButtonProps) => (
  <button className={cn(button({ variant, size }), className)} {...props} />
);
```

要点：
- `min-h-11` = 44px 触控目标，别用 `h-10` 糊过去。
- 焦点样式写在基类里，一处管全部。
- 只用语义色 + 透明度（`/40`），不写 `bg-[#hex]`（检查器会拦）。

## 4. 布局与断点

```html
<div class="mx-auto w-full max-w-[1200px] px-6">
  <div class="grid grid-cols-1 gap-6 md:grid-cols-12">
    <div class="md:col-span-7 min-w-0">…</div>
    <div class="md:col-span-5 min-w-0">…</div>
  </div>
</div>
```

- `min-w-0` 是含图/长文本网格的必需品（配 `minmax(0,1fr)` 思路一致）。
- 断点用默认（`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536`）；自定义断点先在项目里统一。
- 容器查询（组件级自适应，优先于断点）：

```css
@container card (min-width: 28rem) { .card-body { grid-template-columns: 1fr 1fr; } }
```

```html
<article class="@container card">…</article>
```

## 5. 动画

```css
@theme {
  --animate-rise: rise 220ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- 禁止 `transition-all`、禁止 `animate-bounce`（Reflex）。
- 入场动画用 `@starting-style` 或"先可见、再动"，保证无脚本可见。

## 6. 密度

```html
<html data-density="compact">   <!-- 或 normal / airy -->
```

```css
[data-density="compact"] { --space-section: 64px; }
[data-density="airy"]    { --space-section: 128px; }
```

密度是**一个开关**，不是每个区块单独调；配方的 `density` 决定默认值。

## 7. v3 → v4 对照

| v3 | v4 |
|---|---|
| `tailwind.config.ts` 的 `theme.extend` | CSS 里 `@theme { --color-*: … }` |
| `@tailwind base; @tailwind components; @tailwind utilities;` | `@import "tailwindcss";` |
| `darkMode: "class"` | `@custom-variant dark (&:where(.dark, .dark *))` |
| `tailwindcss-animate` 插件 | `@theme { --animate-*: … }` + 原生 `@keyframes` |
| `content: [...]` | 自动检测（需要时 `@source`） |
| `safelist` | `@source inline("…")` |

迁移顺序：先 `@import` → 再把 config 里的颜色/字体搬进 `@theme` → 再换 `darkMode` → 最后处理自定义插件。迁移期间不要同时保留两份 token。

## 8. 常见错误（检查器能抓到的）

| 写法 | 问题 | 改法 |
|---|---|---|
| `bg-[#1a1a1a]` | 颜色绕过 token | `bg-ink` |
| `text-[10px]` | 小于 12px | `text-xs` |
| `transition-all` | 过渡全部属性 | `transition-[color,background-color]` |
| `h-screen` / `min-h-screen` | 移动端 100vh 抖动 | `min-h-svh` |
| `w-screen` / `100vw` | 横向溢出 | `w-full` |
| `outline-none` 无补偿 | 键盘用户失明 | `focus-visible:outline-2` |
| `shadow-[4px_4px_0_#000]` | 硬阴影 | 例外：quarry 配方 |
| `uppercase tracking-widest text-xs` | eyebrow | 删标签 |
| `from-violet-500 to-blue-500` | 紫蓝渐变 | 换配方强调色 |
