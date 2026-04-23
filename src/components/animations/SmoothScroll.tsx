import { useEffect, type ReactNode } from "react";
import { ScrollTrigger } from "@/lib/gsapConfig";

interface SmoothScrollProps {
  children: ReactNode;
}

/**
 * Refreshes ScrollTrigger on mount and after layout shifts.
 * Wrap your landing page layout in this to ensure all triggers
 * are measured correctly after fonts/images load.
 *
 * Note: uses native browser smooth-scroll (CSS `scroll-behavior: smooth`).
 * For ScrollSmoother (GSAP paid plugin), swap in that plugin instead.
 *
 * @example
 * <SmoothScroll>
 *   <Navbar />
 *   <HeroSection />
 *   <FeaturesSection />
 * </SmoothScroll>
 */
const SmoothScroll = ({ children }: SmoothScrollProps) => {
  useEffect(() => {
    // Recalculate all trigger positions after fonts/images finish loading
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);

    // Also refresh after a short delay to catch late layout shifts
    const timer = setTimeout(refresh, 300);

    return () => {
      window.removeEventListener("load", refresh);
      clearTimeout(timer);
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
