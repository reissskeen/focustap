import { useRef, useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

type AnimationFactory = (el: HTMLElement, gsap: typeof import("gsap").gsap) => gsap.core.Timeline | gsap.core.Tween;

/**
 * Run a fully custom GSAP animation tied to a DOM element.
 * Cleans up automatically on unmount — no manual kill() needed.
 *
 * @example
 * const ref = useGSAPAnimation((el, gsap) =>
 *   gsap.from(el, { opacity: 0, y: 40, duration: 1 })
 * );
 * return <div ref={ref} />;
 */
export function useGSAPAnimation<T extends HTMLElement = HTMLDivElement>(
  factory: AnimationFactory,
  deps: unknown[] = []
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const anim = factory(el, gsap);

    return () => {
      anim.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
