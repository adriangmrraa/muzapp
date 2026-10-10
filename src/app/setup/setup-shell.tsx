"use client";

import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  cardEntrance,
} from "@/lib/animation-variants";
import SetupForm from "./setup-form";

export default function SetupShell() {
  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-background"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[120px] opacity-20 bg-[radial-gradient(circle,var(--color-gold)_0%,var(--color-gold-ember)_40%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] opacity-10 gold-glow" />
      </div>

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
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-sm">
        <motion.div className="mb-8 text-center" variants={fadeUp}>
          <h1 className="font-heading text-4xl font-black tracking-tight text-gold-gradient">
            Bienvenido
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.25em] font-medium text-foreground/45">
            Configuración inicial
          </p>
          <div className="mx-auto mt-3 h-px w-16 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        </motion.div>

        <motion.div
          className="glass-card gold-glow rounded-2xl p-8"
          variants={cardEntrance}
        >
          <h2 className="mb-2 text-lg font-semibold text-foreground/85">
            Creá tu cuenta de administrador
          </h2>
          <p className="mb-6 text-xs text-foreground/45">
            Esta página solo está disponible mientras no exista ningún usuario.
            Después de crear la cuenta, se cierra permanentemente.
          </p>
          <SetupForm />
        </motion.div>

        <motion.p
          className="mt-6 text-center text-xs text-foreground/25"
          variants={fadeUp}
        >
          Guardá estas credenciales — son las únicas de acceso al panel
        </motion.p>
      </div>
    </motion.div>
  );
}
