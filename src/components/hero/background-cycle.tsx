"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface BackgroundCycleProps {
  images: string[];
}

export function BackgroundCycle({ images }: BackgroundCycleProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const preload = new Image();
    preload.onload = () => setLoaded(true);
    preload.src = images[0];
  }, [images]);

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!loaded) return;
    let interval: ReturnType<typeof setInterval>;

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        interval = setInterval(advance, 18000);
      }
    };

    interval = setInterval(advance, 18000);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [advance, loaded]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={prefersReduced ? {} : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={prefersReduced ? {} : { opacity: 0, scale: 1.05 }}
          transition={prefersReduced ? { duration: 0.01 } : { duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images[activeIndex]})` }}
          aria-hidden="true"
        />
      </AnimatePresence>
    </div>
  );
}
