---
name: framer-motion-entrance
description: Use when adding entrance animations, page transitions, list staggers, or hover/tap micro-interactions to a React component. Loads when you import framer-motion or change motion props on an existing motion element. Covers the standard initial/animate/transition pattern, the easing curve to use, why motion.div beats CSS keyframes for entrance, and stagger composition. Does not load for purely structural component edits.
---

# Framer Motion — Entrance & Transitions

Use `motion.*` over CSS keyframes for any animation that runs on mount or in response to state. Reasons: React-aware, easier to compose, plays well with React Query state changes.

## Standard entrance

```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
>
  ...
</motion.div>
```

- **Easing**: `[0.22, 1, 0.36, 1]` (custom cubic — feels crisp without being snappy). This is the project standard.
- **Duration**: `0.35s` for entrance, `0.2s` for state changes (e.g. hover), `0.5s` for hero/scroll reveals
- **Translate**: `y: 8` for short rise, `y: 16` for hero. Don't translate more than 24px on entrance.

## Stagger (list of cards)

```tsx
<motion.div
  initial="hidden"
  animate="show"
  variants={{
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  }}
>
  {items.map((item) => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      ...
    </motion.div>
  ))}
</motion.div>
```

`staggerChildren: 0.06` is the project default. Don't exceed `0.1` — feels sluggish on long lists.

## Hover / tap

```tsx
<motion.button
  whileHover={{ y: -1, transition: { duration: 0.15 } }}
  whileTap={{ scale: 0.98 }}
>
  ...
</motion.button>
```

Subtle. Never scale by more than `0.05` on tap. Never lift more than `2px` on hover.

## Scroll reveals

Use `whileInView` with `viewport={{ once: true, margin: "-10% 0px" }}` so each section animates once when ~10% into the viewport.

## Reduced motion

For long-duration entrance or scroll reveals, respect `prefers-reduced-motion`:

```tsx
const shouldReduce = useReducedMotion();
const transition = shouldReduce ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] };
```

## Don't

- Don't use CSS `@keyframes` for entrance — use `motion.*`
- Don't animate `box-shadow` directly — animate `opacity` of an overlay or use Framer's `boxShadow` transition (expensive otherwise)
- Don't chain entrance + scroll-reveal on the same element — pick one trigger
