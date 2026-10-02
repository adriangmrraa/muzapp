"use client";

import { motion } from "framer-motion";
import { pageEnter } from "@/lib/animation-variants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export default function StorefrontTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return <>{children}</>;

  return (
    <motion.div variants={pageEnter} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}
