"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

interface ParallaxDividerProps {
  image: string;
  height?: string;
  overlay?: number;
  children?: React.ReactNode;
}

export function ParallaxDivider({
  image,
  height = "50vh",
  overlay = 0.55,
  children,
}: ParallaxDividerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <div
      ref={ref}
      className="relative overflow-hidden w-full"
      style={{ height, minHeight: "200px", maxWidth: "100vw" }}
    >
      <motion.div
        className="absolute inset-x-0"
        style={{ y, top: "-15%", bottom: "-15%", height: "130%", position: "absolute" }}
      >
        <Image
          src={image}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,${overlay}) 0%, rgba(0,0,0,${overlay * 0.7}) 50%, rgba(0,0,0,${overlay}) 100%)`,
        }}
      />

      {children && (
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          {children}
        </div>
      )}
    </div>
  );
}
