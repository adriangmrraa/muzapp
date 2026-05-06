"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroParallax } from "./hero-parallax";
import { heroEntrance, heroChild } from "@/lib/animation-variants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <HeroParallax>
      <motion.div
        className="flex flex-col items-center gap-6"
        variants={heroEntrance}
        initial="hidden"
        animate="visible"
      >
        <motion.span
          variants={heroChild}
          className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(212,160,23,0.1)",
            border: "1px solid rgba(212,160,23,0.3)",
            color: "#D4A017",
          }}
        >
          Hamburguesas Artesanales Premium
        </motion.span>

        <motion.h1
          variants={heroChild}
          className="text-6xl sm:text-7xl md:text-8xl font-black leading-none tracking-tight"
          style={{
            fontFamily: "var(--font-playfair), serif",
            background: "linear-gradient(135deg, #D4A017 0%, #F5A623 50%, #E8712A 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Mrs
          <br />
          Muzzarella
        </motion.h1>

        <motion.p
          variants={heroChild}
          className="text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed font-light"
        >
          Sabores únicos, ingredientes de primera. Cada mordida es una experiencia que no vas a olvidar.
        </motion.p>

        <motion.div variants={heroChild} className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link
            href="/hamburguesas"
            className="btn-gold inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest"
          >
            Ver Hamburguesas
          </Link>
          <Link
            href="/pan-mayorista"
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold uppercase tracking-widest rounded-full transition-all duration-300 hover:scale-105"
            style={{
              background: "rgba(212,160,23,0.1)",
              border: "1px solid rgba(212,160,23,0.4)",
              color: "#D4A017",
            }}
          >
            Pan Mayorista
          </Link>
        </motion.div>

        <motion.div
          variants={heroChild}
          className="mt-12 flex flex-col items-center gap-2 opacity-40"
        >
          <span className="text-xs tracking-widest uppercase text-white/60">
            Scroll
          </span>
          <motion.div
            className="w-px h-8 rounded-full"
            style={{
              background: "linear-gradient(to bottom, rgba(212,160,23,0.6), transparent)",
            }}
            animate={prefersReduced ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={prefersReduced ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </HeroParallax>
  );
}
