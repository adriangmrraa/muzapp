"use client";

import { createElement, type CSSProperties, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TextRevealProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  style?: CSSProperties;
  wordStyle?: CSSProperties;
  delay?: number;
  stagger?: number;
  once?: boolean;
  mode?: "animate" | "whileInView";
  /** Line indexes whose words render inside <em> (real italic face). */
  emLines?: number[];
}

export function TextReveal({
  text,
  as = "span",
  className,
  style,
  wordStyle,
  delay = 0.1,
  stagger = 0.09,
  once = true,
  mode = "animate",
  emLines,
}: TextRevealProps) {
  const prefersReduced = useReducedMotion();

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: prefersReduced ? 0 : stagger, delayChildren: delay },
    },
  };

  const word: Variants = {
    hidden: prefersReduced ? { opacity: 0 } : { y: "115%", rotate: 4, opacity: 0 },
    visible: {
      y: "0%",
      rotate: 0,
      opacity: 1,
      transition: prefersReduced
        ? { duration: 0.01 }
        : { duration: 0.65, ease: [0.33, 1, 0.68, 1] },
    },
  };

  const lines = text.split("\n");

  const content: ReactNode = lines.map((line, li) => (
    <span key={li} className="block">
      {line.split(" ").map((w, wi) => {
        const wordSpan = (
          <motion.span
            variants={word}
            className="inline-block will-change-transform"
            style={wordStyle}
          >
            {w}
            {wi < line.split(" ").length - 1 ? "\u00A0" : ""}
          </motion.span>
        );
        return (
          <span
            key={wi}
            className="inline-block overflow-hidden align-bottom"
            style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}
          >
            {emLines?.includes(li) ? <em>{wordSpan}</em> : wordSpan}
          </span>
        );
      })}
    </span>
  ));

  return createElement(
    motion[as] as typeof motion.div,
    {
      className,
      style,
      variants: container,
      initial: "hidden",
      ...(mode === "animate"
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: { once, margin: "-60px" } }),
    },
    content
  );
}
