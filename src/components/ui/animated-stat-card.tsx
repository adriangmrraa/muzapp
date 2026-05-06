"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useCountUp } from "@/hooks/use-count-up";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AnimatedStatCardProps {
  value: string;
  label: string;
}

export function AnimatedStatCard({ value, label }: AnimatedStatCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const prefersReduced = useReducedMotion();
  const numericValue = parseInt(value);
  const isNumeric = !isNaN(numericValue);
  const count = useCountUp({ end: isNumeric ? numericValue : 0, enabled: inView });

  return (
    <motion.div
      ref={ref}
      initial={prefersReduced ? {} : { opacity: 0, y: 20, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={prefersReduced ? { duration: 0.01 } : { duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl text-center"
      style={{
        background: "rgba(212,160,23,0.07)",
        border: "1px solid rgba(212,160,23,0.2)",
      }}
    >
      <span
        className="text-3xl font-black"
        style={{
          background: "linear-gradient(135deg, #D4A017, #F5A623)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {isNumeric ? count : value}
        {isNumeric && value.includes("+") ? "+" : ""}
        {isNumeric && value.includes("%") ? "%" : ""}
      </span>
      <span className="text-xs text-white/50 font-medium">
        {label}
      </span>
    </motion.div>
  );
}
