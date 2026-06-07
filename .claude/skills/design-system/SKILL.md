---
name: design-system
description: Use when editing any .tsx or .css file under src/ that sets colors, backgrounds, borders, shadows, border-radius, fonts, or card/button styles. Enforces the FocusTap light-mode design system. Loads when you write or modify visual properties — not for logic-only edits. Covers token values, the inline-style rule for rgba, the standard card pattern, accent usage (purple for student/CTA, cyan for professor), and which legacy dark-mode patterns to avoid.
---

# FocusTap Design System (Light Mode)

The app is **light mode across all pages**. If you find yourself writing `#09090f`, `rgba(255,255,255,0.03)`, `border-radius: 16px`, or any "dark glass" pattern — stop. Those are legacy and wrong.

## Backgrounds

| Surface | Value |
|---|---|
| Landing page shell | `#f6f2ea` (warm cream, applied via `.ft-landing-shell`) |
| App pages | `#f6f7fa` (light gray-white) |
| Cards | `rgba(17,24,39,0.03)` background, `1px solid rgba(17,24,39,0.08)` border |

## Text

| Role | Value |
|---|---|
| Headings | `#111827` |
| Body / muted | `#667085` |
| Faint / placeholder | `#98a2b3` |

## Accents

- **`#8b6cff` (purple)** — students, primary CTAs, focus states
- **`#22d3ee` (cyan)** — professors, secondary actions, charts

Never introduce a third accent without checking with the user.

## Type

- Font: **Plus Jakarta Sans** (already loaded globally)
- Buttons with inline styles must include `fontFamily: "inherit"` — otherwise they fall back to the user agent default

## Card Pattern (copy verbatim)

```tsx
<div
  style={{
    background: "rgba(17,24,39,0.03)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: 14,
  }}
>
  ...
</div>
```

`borderRadius: 14` (not 16). Use **inline styles** for the rgba values — Tailwind cannot express them precisely.

## Banned patterns

- `#09090f` background or any near-black surface
- `rgba(255,255,255,0.0X)` cards or borders
- `border-radius: 16` (legacy)
- `bg-zinc-9XX`, `bg-neutral-9XX`, `bg-black` on app surfaces
- New colors outside the tokens above

## CSS variables

`:root` in `src/index.css` already holds the light tokens. Prefer `var(--token-name)` over hardcoded hex when a CSS variable exists for the value.
