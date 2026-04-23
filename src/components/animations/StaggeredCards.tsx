import { useRef, useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

interface StaggeredCardsProps {
  children: ReactNode;
  /** CSS selector for direct card children. Default ".stagger-card" */
  childSelector?: string;
  stagger?: number;
  duration?: number;
  preset?: "fadeUp" | "fadeIn" | "scale";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reveals a grid of cards one after another on scroll.
 * Add className "stagger-card" to each child, or pass a custom selector.
 *
 * @example
 * <StaggeredCards className="grid grid-cols-3 gap-6">
 *   <div className="stagger-card">...</div>
 *   <div className="stagger-card">...</div>
 * </StaggeredCards>
 */
const StaggeredCards = ({
  children,
  childSelector = ".stagger-card",
  stagger = 0.1,
  duration = 0.65,
  preset = "fadeUp",
  className,
  style,
}: StaggeredCardsProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const cards = el.querySelectorAll(childSelector);
    if (!cards.length) return;

    const from: gsap.TweenVars =
      preset === "scale"
        ? { opacity: 0, scale: 0.9, y: 20 }
        : preset === "fadeIn"
        ? { opacity: 0 }
        : { opacity: 0, y: 40 };

    const tween = gsap.from(cards, {
      ...from,
      duration,
      stagger,
      clearProps: "all",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [childSelector, stagger, duration, preset]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default StaggeredCards;
