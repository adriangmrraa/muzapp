"use client";

import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  cardEntrance,
} from "@/lib/animation-variants";
import LoginForm from "./login-form";
import { useBusiness } from "@/lib/hooks/use-business";

export default function LoginShell() {
  const business = useBusiness();
  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Premium background: layered radial glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary ambient glow — top center */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[120px] opacity-20 bg-[radial-gradient(circle,var(--color-gold)_0%,var(--color-gold-ember)_40%,transparent_70%)]" />
        {/* Secondary glow — bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] opacity-10 gold-glow" />
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px 200px",
          }}
        />
      </div>

      {/* Animated gold orb behind the card */}
      <motion.div
        className="gold-orb absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          filter: "blur(40px)",
          top: "50%",
          left: "50%",
          x: "-50%",
          y: "-50%",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <motion.div className="mb-8 text-center" variants={fadeUp}>
          <h1 className="font-heading text-4xl font-black tracking-tight text-gold-gradient">
            {business?.name || "Admin"}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.25em] font-medium text-foreground/45">
            Panel de Administración
          </p>
          {/* Gold accent line */}
          <div className="mx-auto mt-3 h-px w-16 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        </motion.div>

        {/* Glass card */}
        <motion.div
          className="glass-card gold-glow rounded-2xl p-8"
          variants={cardEntrance}
        >
          <h2 className="mb-6 text-lg font-semibold text-foreground/85">
            Iniciá sesión
          </h2>
          <LoginForm />
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-6 text-center text-xs text-foreground/25"
          variants={fadeUp}
        >
          Acceso restringido al personal autorizado
        </motion.p>
      </div>
    </motion.div>
  );
}
