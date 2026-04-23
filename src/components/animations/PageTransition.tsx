import { useRef, useEffect, type ReactNode } from "react";
import { gsap } from "@/lib/gsapConfig";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  /** Animation style. Default "fade" */
  variant?: "fade" | "slideUp" | "blur";
  duration?: number;
}

/**
 * Wraps a page and animates it in on every route change.
 * Put this inside each page component (not in the router).
 *
 * @example
 * const Login = () => (
 *   <PageTransition variant="fade">
 *     <div>...</div>
 *   </PageTransition>
 * );
 */
const PageTransition = ({
  children,
  variant = "fade",
  duration = 0.45,
}: PageTransitionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars =
      variant === "slideUp"
        ? { opacity: 0, y: 24 }
        : variant === "blur"
        ? { opacity: 0, filter: "blur(8px)" }
        : { opacity: 0 };

    const tween = gsap.from(el, { ...from, duration, clearProps: "all" });
    return () => tween.kill();
  // Re-run on route change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return <div ref={ref}>{children}</div>;
};

export default PageTransition;
