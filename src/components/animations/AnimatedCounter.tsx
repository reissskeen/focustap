import { useRef, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * Counts from `start` to `end` when scrolled into view.
 *
 * @example
 * <AnimatedCounter end={500} suffix="+" className="text-4xl font-bold" />
 */
const AnimatedCounter = ({
  end,
  start = 0,
  duration = 1.8,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obj = { value: start };

    const tween = gsap.to(obj, {
      value: end,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = `${prefix}${obj.value.toFixed(decimals)}${suffix}`;
      },
      scrollTrigger: {
        trigger: el,
        start: "top 88%",
        toggleActions: "play none none none",
      },
    });

    el.textContent = `${prefix}${start.toFixed(decimals)}${suffix}`;

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [end, start, duration, prefix, suffix, decimals]);

  return <span ref={ref} className={className}>{prefix}{start.toFixed(decimals)}{suffix}</span>;
};

export default AnimatedCounter;
