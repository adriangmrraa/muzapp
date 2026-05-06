"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { heroEntrance } from "@/lib/animation-variants";

interface PageHeroProps {
  backgroundImage: string;
  children: ReactNode;
}

export function PageHero({ backgroundImage, children }: PageHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.5]);

  return (
    <section
      ref={ref}
      className="relative min-h-[65vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0"
        style={{ y, top: "-10%", bottom: "-10%", height: "120%" }}
      >
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)",
          }}
        />
      </motion.div>

      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-5 max-w-4xl"
        variants={heroEntrance}
        initial="hidden"
        animate="visible"
        style={{ opacity }}
      >
        {children}
      </motion.div>
    </section>
  );
}
