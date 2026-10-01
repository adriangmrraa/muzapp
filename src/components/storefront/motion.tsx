"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

export const editorialEase = [0.22, 1, 0.36, 1] as const;
export const editorialSpring = { type: "spring", stiffness: 340, damping: 34 } as const;

export function useEditorialMotion() {
  const reduced = useReducedMotion();
  const reveal: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.65, ease: editorialEase } },
  };
  return { reduced, reveal };
}

export function EditorialHeading({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { reduced } = useEditorialMotion();
  return <span className={`editorial-mask ${className}`}><motion.span
    initial={reduced ? false : { y: "110%", rotate: 2 }}
    animate={{ y: 0, rotate: 0 }}
    transition={{ duration: 0.85, ease: editorialEase }}>{children}</motion.span></span>;
}
