"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AnimatedStatCardProps {
  value: string;
  label: string;
}

// Count-up only when the whole value is digits plus at most one unit suffix —
// "Pan", "♥" or "$1.234" render verbatim instead of a broken 0→N tween.
const NUMERIC_PATTERN = /^\d+[%+]?$/;

export function AnimatedStatCard({ value, label }: AnimatedStatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReduced = useReducedMotion();
  const isNumeric = NUMERIC_PATTERN.test(value);
  const numericValue = isNumeric ? parseInt(value, 10) : 0;
  const unit = isNumeric ? value.replace(/^\d+/, "") : "";
  const count = useCountUp({ end: numericValue, enabled: inView });

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={prefersReduced ? { duration: 0.01 } : { duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-center bg-primary/[0.07] border border-primary/20"
    >
      <span className="text-4xl font-black tabular-nums text-gold-gradient">
        {isNumeric ? count : value}
        {unit ? (
          <span className="text-sm font-medium text-foreground/50">{unit}</span>
        ) : null}
      </span>
      <span className="text-xs text-foreground/50 font-medium">
        {label}
      </span>
    </motion.div>
  );
}
