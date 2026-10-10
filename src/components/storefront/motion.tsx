"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { reducedMotionVariant } from "@/lib/animation-variants";
import { type ReactNode } from "react";

export const editorialEase = [0.22, 1, 0.36, 1] as const;
export const editorialSpring = { type: "spring", stiffness: 340, damping: 34 } as const;

export function useEditorialMotion() {
  const reduced = useReducedMotion();
  const reveal: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.65, ease: editorialEase } },
  };
  /** Reduced-motion parity for every variant in lib/animation-variants —
      wrap before passing to `variants={...}` (riseIn, popIn, etc.). */
  const variant = (original: Variants): Variants =>
    reduced ? reducedMotionVariant(original) : original;
  return { reduced, reveal, variant };
}

export function EditorialHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { reduced } = useEditorialMotion();
  return <span className={`editorial-mask ${className}`}><motion.span
    initial={reduced ? false : { y: "110%", rotate: 2 }}
    animate={{ y: 0, rotate: 0 }}
    transition={{ duration: 0.85, ease: editorialEase }}>{children}</motion.span></span>;
}
