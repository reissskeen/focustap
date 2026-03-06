

## Plan: Integrate ContainerScroll Animation & Elevate Landing Page

### Overview
Add the `ContainerScroll` component from 21st.dev to `src/components/ui/` and integrate it into the landing page hero section to create a dramatic scroll-driven 3D product showcase.

### Prerequisites Check
- **shadcn structure**: Already in place (`components/ui/` exists)
- **Tailwind CSS**: Configured
- **TypeScript**: Configured
- **framer-motion**: Already installed (v12.34.0)
- No new dependencies needed

### Changes

#### 1. Create `src/components/ui/container-scroll-animation.tsx`
- Copy the component as-is, removing the `"use client"` directive (not needed in Vite/React)
- No modifications needed -- it uses `framer-motion` which is already installed

#### 2. Update `src/pages/Index.tsx` -- Hero Section Redesign
Replace the current static hero with the `ContainerScroll` component:
- **Title component**: Keep the existing hero text (badge, headline, subtitle, CTA buttons, pitch/financials tags) as the `titleComponent` prop
- **Children (card content)**: Show a product screenshot mockup of the FocusTap dashboard using an Unsplash classroom/dashboard image (e.g. `https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&q=80`) as an `<img>` tag (not Next.js `Image`)
- Remove the old `<section>` wrapper and replace with `ContainerScroll` which provides its own spacing and perspective container
- Adjust padding: remove `pt-32 pb-20` from hero since `ContainerScroll` handles vertical space (`h-[60rem] md:h-[80rem]`)
- Keep Navbar above the scroll container

#### 3. No other files need changes
- All existing sections (Features, How It Works, CTA, Footer) remain untouched below the new hero

### Key Adaptations from Demo
- Replace `next/image` `Image` with standard `<img>` tag
- Use a real Unsplash URL instead of the aceternity placeholder
- Wire existing hero content as `titleComponent` rather than the demo's generic text

