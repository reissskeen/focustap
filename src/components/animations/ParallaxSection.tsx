import { useRef, useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsapConfig";

interface ParallaxSectionProps {
  children: ReactNode;
  /** How many px the inner content shifts over the full scroll distance. Default 60 */
  depth?: number;
  /** Direction of movement. Default "up" (content moves up as you scroll down) */
  direction?: "up" | "down";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps children in a parallax layer. The inner content moves at a
 * different speed than the page scroll, creating depth.
 *
 * @example
 * <ParallaxSection depth={80}>
 *   <img src={dashboardScreenshot} />
 * </ParallaxSection>
 */
const ParallaxSection = ({
  children,
  depth = 60,
  direction = "up",
  className,
  style,
}: ParallaxSectionProps) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const sign = direction === "up" ? -1 : 1;

    const tween = gsap.to(inner, {
      y: sign * depth,
      ease: "none",
      scrollTrigger: {
        trigger: outer,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === outer) t.kill();
      });
    };
  }, [depth, direction]);

  return (
    <div ref={outerRef} className={className} style={{ overflow: "hidden", ...style }}>
      <div ref={innerRef}>{children}</div>
    </div>
  );
};

export default ParallaxSection;
