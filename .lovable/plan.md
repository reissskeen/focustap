

## Plan: Integrate HeroSection Dark Component & Replace Current Hero

### Overview
Add the `HeroSection` component with its `RetroGrid` background to `src/components/ui/` and replace the current `ContainerScroll` hero with this new component, adapted to FocusTap's content and branding.

### Prerequisites
All met: shadcn structure, Tailwind, TypeScript, lucide-react already installed. No new dependencies needed.

### Changes

#### 1. Add `animate-grid` keyframe to `tailwind.config.ts`
The `RetroGrid` sub-component uses an `animate-grid` class. Add the keyframe and animation:
- Keyframe: `grid` -- translates background position vertically by one cell size over 15s linear infinite
- Animation: `grid: "grid 15s linear infinite"`

#### 2. Create `src/components/ui/hero-section-dark.tsx`
Copy the component as-is with these adaptations:
- Remove `"use client"` (not needed in Vite)
- Replace `font-geist` references with `font-display` (project uses Space Grotesk via `font-display`)
- Keep `RetroGrid` inline within the same file
- Keep all props and defaults intact

#### 3. Update `src/pages/Index.tsx` -- Replace Hero Section
Replace the `ContainerScroll` hero block (lines 70-124) with the new `HeroSection` component:
- **title**: `"Focus tracking for modern classrooms"`
- **subtitle**: `{ regular: "Measure focus, ", gradient: "not compliance." }`
- **description**: Current hero description text
- **ctaText**: `"Get Started"` linking to `/login?mode=login`
- **bottomImage**: Use the existing Unsplash classroom image for both light/dark (or two different ones)
- **gridOptions**: Tuned for the blue FocusTap palette (`lightLineColor: "#3b82f6"`, `darkLineColor: "#1e40af"`, opacity 0.3)
- Keep the Student Login / Professor Login buttons and Pitch Deck / Financial Model tags below the hero component as an overlay or additional section
- Remove the `ContainerScroll` import (the component file can remain for potential future use)
- Add appropriate top padding to account for the fixed Navbar

#### 4. Adapt CTA styling
The `HeroSection` component uses an animated spinning border CTA button. We'll keep it but wire it to the existing login route via `<Link>` instead of a plain `<a>` tag.

### What stays the same
- Features section, How It Works, CTA, Footer -- all untouched
- Navbar -- untouched
- All scroll animations on Features/How It Works -- preserved

