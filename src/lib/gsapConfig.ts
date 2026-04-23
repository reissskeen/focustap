import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Global defaults — keeps all animations feeling cohesive
gsap.defaults({ ease: "power3.out", duration: 0.7 });

export { gsap, ScrollTrigger };
