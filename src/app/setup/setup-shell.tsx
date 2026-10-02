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
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "#0a0a0a" }}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full blur-[120px] opacity-20"
          style={{
            background:
              "radial-gradient(circle, #D4A017 0%, #E8712A 40%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{
            background: "radial-gradient(circle, #8B0000 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,160,23,0.18) 0%, rgba(232,113,42,0.08) 40%, transparent 70%)",
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
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Bienvenido
          </h1>
          <p
            className="mt-2 text-sm uppercase tracking-[0.25em] font-medium"
            style={{ color: "rgba(245,245,220,0.45)" }}
          >
            Configuración inicial
          </p>
          <div
            className="mx-auto mt-3 h-px w-16 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, #D4A017, transparent)",
            }}
          />
        </motion.div>

        <motion.div
          className="rounded-2xl p-8"
          variants={cardEntrance}
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(212,160,23,0.3)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,160,23,0.05) inset",
          }}
        >
          <h2
            className="mb-2 text-lg font-semibold"
            style={{ color: "rgba(245,245,220,0.85)" }}
          >
            Creá tu cuenta de administrador
          </h2>
          <p
            className="mb-6 text-xs"
            style={{ color: "rgba(245,245,220,0.45)" }}
          >
            Esta página solo está disponible mientras no exista ningún usuario.
            Después de crear la cuenta, se cierra permanentemente.
          </p>
          <SetupForm />
        </motion.div>

        <motion.p
          className="mt-6 text-center text-xs"
          style={{ color: "rgba(245,245,220,0.25)" }}
          variants={fadeUp}
        >
          Guardá estas credenciales — son las únicas de acceso al panel
        </motion.p>
      </div>
    </motion.div>
  );
}
