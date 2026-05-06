"use client";

import { useReducedMotion as fmUseReducedMotion } from "framer-motion";

export function useReducedMotion(): boolean {
  const prefersReduced = fmUseReducedMotion();
  return prefersReduced ?? false;
}
