import { useRef, useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsapConfig";

interface MagneticOptions {
  /** How far the element travels toward the cursor (px). Default 12 */
  strength?: number;
  /** Spring-back duration when cursor leaves (s). Default 0.4 */
  releaseDuration?: number;
}

/**
 * Makes an element follow the cursor magnetically on hover.
 * Snaps back smoothly when the cursor leaves.
 *
 * @example
 * const ref = useMagneticHover({ strength: 16 });
 * return <button ref={ref}>Get Started</button>;
 */
export function useMagneticHover<T extends HTMLElement = HTMLButtonElement>(
  options: MagneticOptions = {}
): RefObject<T> {
  const { strength = 12, releaseDuration = 0.4 } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = ((e.clientX - cx) / (rect.width / 2)) * strength;
      const dy = ((e.clientY - cy) / (rect.height / 2)) * strength;
      gsap.to(el, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
    };

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: releaseDuration, ease: "elastic.out(1, 0.4)" });
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      gsap.killTweensOf(el);
    };
  }, [strength, releaseDuration]);

  return ref;
}
