"use client";

import { motion } from "framer-motion";
import { GlassWater, Sparkles } from "lucide-react";

export function TragoHero() {
  return (
    <div className="relative min-h-[50vh] flex items-center justify-center overflow-hidden rounded-3xl border border-[#ff007f]/20 bg-gradient-to-br from-[#1a0011] via-[#0a0008] to-[#1a0011]">
      {/* Neon glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#ff007f]/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-[#ff00ff]/10 blur-[80px]" />

      {/* Sparkle dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-[#ff007f]/40"
          style={{
            top: `${15 + i * 12}%`,
            left: `${10 + i * 15}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
        />
      ))}

      <div className="relative z-10 text-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <GlassWater className="h-6 w-6 text-[#ff007f]" />
            <span className="text-[10px] font-semibold text-[#ff007f]/60 uppercase tracking-[0.3em]">
              Colaboración Exclusiva
            </span>
            <Sparkles className="h-4 w-4 text-[#ff007f]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_30px_rgba(255,0,127,0.3)]">
            Tragos <span className="text-[#ff007f]">V.I.P</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 font-light max-w-2xl mx-auto mb-2">
            De 1 Litro
          </p>
          <p className="text-sm md:text-base text-[#ff007f]/80 font-medium max-w-xl mx-auto">
            Con muchas gomitas y salsas de caramelo
          </p>

          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ff007f]/30 bg-[#ff007f]/5 text-xs text-[#ff007f]/70">
            Elegí tu sabor favorite y personalizalo
          </div>
        </motion.div>
      </div>
    </div>
  );
}
