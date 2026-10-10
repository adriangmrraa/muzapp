"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HeroParallax } from "./hero-parallax";
import { heroEntrance, heroChild } from "@/lib/animation-variants";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TextReveal } from "@/components/motion/text-reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { useBusiness } from "@/lib/hooks/use-business";

export function HeroSection() {
  const prefersReduced = useReducedMotion();
  const business = useBusiness();
  // Break the configured name on the first space ("Mrs Muzzarella" → "Mrs\nMuzzarella").
  const heroText = (business?.name || "Mi Negocio").replace(" ", "\n");

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
          className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary"
        >
          Hamburguesas Artesanales Premium
        </motion.span>

        <TextReveal
          as="h1"
          text={heroText}
          delay={0.35}
          stagger={0.14}
          className="text-5xl sm:text-6xl md:text-8xl font-black leading-none tracking-tight font-heading"
          wordStyle={{
            background: "linear-gradient(135deg, var(--color-gold) 0%, var(--color-gold-bright) 50%, var(--color-gold-ember) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        />

        <motion.p
          variants={heroChild}
          className="text-lg sm:text-xl text-foreground/70 max-w-xl leading-relaxed font-light"
        >
          Sabores únicos, ingredientes de primera. Cada mordida es una experiencia que no vas a olvidar.
        </motion.p>

        <motion.div variants={heroChild} className="flex flex-col sm:flex-row gap-4 mt-4">
          <Magnetic>
            <Link
              href="/hamburguesas"
              className="btn-gold shine-sweep inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest"
            >
              Ver Hamburguesas
            </Link>
          </Magnetic>
          <Magnetic>
            <Link
              href="/pan-mayorista"
              className="btn-outline-gold shine-sweep px-8 py-4 text-sm uppercase tracking-widest"
            >
              Pan Mayorista
            </Link>
          </Magnetic>
        </motion.div>

        <motion.div
          variants={heroChild}
          className="mt-12 flex flex-col items-center gap-2 opacity-40"
        >
          <span className="text-xs tracking-widest uppercase text-foreground/60">
            Scroll
          </span>
          <motion.div
            className="w-px h-8 rounded-full bg-gradient-to-b from-primary/60 to-transparent"
            animate={prefersReduced ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={prefersReduced ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </HeroParallax>
  );
}
