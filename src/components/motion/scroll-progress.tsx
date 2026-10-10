"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left pointer-events-none bg-gradient-to-r from-gold via-gold-bright to-gold-ember shadow-[0_0_12px_rgba(212,160,23,0.45)]"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
