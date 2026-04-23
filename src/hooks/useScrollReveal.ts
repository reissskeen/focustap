import { useRef, useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

type Preset = "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" | "blur" | "scale";

interface ScrollRevealOptions {
  preset?: Preset;
  delay?: number;
  duration?: number;
  /** Fraction of element visible before trigger fires (0–1) */
  threshold?: number;
  /** Only animate once (default: true) */
  once?: boolean;
  /** Stagger child elements instead of the container */
  staggerChildren?: string;
  staggerAmount?: number;
}

const PRESETS: Record<Preset, gsap.TweenVars> = {
  fadeUp:    { opacity: 0, y: 48 },
  fadeIn:    { opacity: 0 },
  fadeLeft:  { opacity: 0, x: -48 },
  fadeRight: { opacity: 0, x: 48 },
  blur:      { opacity: 0, filter: "blur(12px)", y: 20 },
  scale:     { opacity: 0, scale: 0.92 },
};

/**
 * Attach scroll-triggered reveal to a container element.
 * Optionally stagger child elements matching a CSS selector.
 *
 * @example
 * const ref = useScrollReveal('fadeUp', { delay: 0.1 });
 * return <section ref={ref}>...</section>;
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  preset: Preset = "fadeUp",
  options: ScrollRevealOptions = {}
): RefObject<T> {
  const {
    delay = 0,
    duration = 0.7,
    threshold = 0.15,
    once = true,
    staggerChildren,
    staggerAmount = 0.08,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = PRESETS[preset];
    const targets = staggerChildren ? el.querySelectorAll(staggerChildren) : [el];

    const tween = gsap.from(targets, {
      ...from,
      duration,
      delay,
      stagger: staggerChildren ? staggerAmount : 0,
      clearProps: "all",
      scrollTrigger: {
        trigger: el,
        start: `top ${Math.round((1 - threshold) * 100)}%`,
        toggleActions: once ? "play none none none" : "play reverse play reverse",
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [preset, delay, duration, threshold, once, staggerChildren, staggerAmount]);

  return ref;
}
