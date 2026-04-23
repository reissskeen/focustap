import { useRef, useEffect, type ElementType, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

interface TextRevealProps {
  children: ReactNode;
  as?: ElementType;
  /** "words" splits by word, "chars" by character */
  mode?: "words" | "chars" | "line";
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  /** If true, animates immediately (no scroll trigger) */
  eager?: boolean;
}

/**
 * Splits text into words or chars and animates each in on scroll.
 * Works with any heading or paragraph tag.
 *
 * @example
 * <TextReveal as="h1" mode="words">Measure focus, not compliance.</TextReveal>
 */
const TextReveal = ({
  children,
  as: Tag = "p",
  mode = "words",
  delay = 0,
  duration = 0.6,
  className,
  style,
  eager = false,
}: TextRevealProps) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof children !== "string") return;

    const text = el.textContent ?? "";
    const units =
      mode === "chars"
        ? text.split("")
        : mode === "words"
        ? text.split(/\s+/).filter(Boolean)
        : [text];

    const separator = mode === "chars" ? "" : " ";

    // Wrap each unit in a span
    el.innerHTML = units
      .map(
        (u) =>
          `<span style="display:inline-block;overflow:hidden;vertical-align:bottom"><span class="__reveal-unit" style="display:inline-block">${u}</span></span>`
      )
      .join(separator);

    const spans = el.querySelectorAll<HTMLSpanElement>(".__reveal-unit");

    const tween = gsap.from(spans, {
      yPercent: 110,
      opacity: 0,
      duration,
      delay,
      stagger: mode === "chars" ? 0.025 : 0.06,
      ease: "power3.out",
      clearProps: "all",
      ...(eager
        ? {}
        : {
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }),
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
      el.textContent = text;
    };
  }, [children, mode, delay, duration, eager]);

  // @ts-expect-error dynamic tag
  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
};

export default TextReveal;
