"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { BackgroundCycle } from "./background-cycle";
import { BG_IMAGES } from "@/lib/constants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function HeroParallax({ children }: { children: ReactNode }) {
  const prefersReduced = useReducedMotion();
  const isMobile = useIsMobile();

  if (prefersReduced || isMobile) {
    return (
      <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden">
        <div className="absolute inset-0">
          <BackgroundCycle images={BG_IMAGES} />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)",
            }}
          />
        </div>
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl">
          {children}
        </div>
      </section>
    );
  }

  const { scrollY } = useScroll();
  const yOffset = useTransform(scrollY, [0, 500], [0, 30]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.6]);

  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen text-center px-4 overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: yOffset }}>
        <BackgroundCycle images={BG_IMAGES} />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </motion.div>

      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 max-w-4xl"
        style={{ opacity }}
      >
        {children}
      </motion.div>
    </section>
  );
}
