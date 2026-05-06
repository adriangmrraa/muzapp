"use client";

import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  cardEntrance,
  heroEntrance,
  heroChild,
} from "@/lib/animation-variants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";
import type { Campaign } from "@/lib/constants";

interface PromoMeta {
  headline: string;
  sub: string;
  emoji: string;
  badge: string;
}

interface PromoPageClientProps {
  slug: string;
  campaign: Campaign;
  meta: PromoMeta;
}

const trustItems = [
  { icon: "🏆", label: "Calidad Artesanal" },
  { icon: "⚡", label: "Respuesta Inmediata" },
  { icon: "❤️", label: "100% Sin Conservantes" },
];

export function PromoPageClient({ slug, campaign, meta }: PromoPageClientProps) {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] relative flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 60% 10%, rgba(212,160,23,0.12) 0%, transparent 55%), #0a0a0a",
      }}
    >
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 pb-20">
        <motion.div
          className="max-w-3xl mx-auto flex flex-col items-center gap-6"
          variants={heroEntrance}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.span
            variants={heroChild}
            className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(212,160,23,0.12)",
              border: "1px solid rgba(212,160,23,0.35)",
              color: "#D4A017",
            }}
          >
            {meta.badge}
          </motion.span>

          {/* Emoji icon */}
          <motion.div
            variants={heroChild}
            whileHover={{ scale: 1.08, rotate: 3 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl cursor-default"
            style={{
              background:
                "linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(232,113,42,0.12) 100%)",
              border: "1px solid rgba(212,160,23,0.3)",
            }}
          >
            {meta.emoji}
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={heroChild}
            className="text-4xl sm:text-6xl font-black leading-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background:
                "linear-gradient(135deg, #D4A017 0%, #F5A623 50%, #E8712A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {meta.headline}
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={heroChild}
            className="text-lg text-white/65 max-w-xl leading-relaxed"
          >
            {meta.sub}
          </motion.p>

          {/* CTA */}
          <motion.div
            variants={heroChild}
            className="mt-4 flex flex-col items-center gap-3"
          >
            <WhatsAppCTA
              campaignSlug={slug}
              message={campaign.whatsappMessage}
              label="Aprovechá la promo"
            />
            <p className="text-white/35 text-xs">
              Respuesta inmediata por WhatsApp
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Trust indicators */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="rounded-2xl p-8"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(212,160,23,0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {trustItems.map((item) => (
                <motion.div
                  key={item.label}
                  variants={cardEntrance}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 16px rgba(212,160,23,0.15)",
                  }}
                  className="flex flex-col items-center gap-2 text-center py-2 rounded-xl cursor-default"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-white/70">
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4"
        >
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em]"
            style={{ color: "#D4A017" }}
          >
            ¿Tenés preguntas?
          </p>
          <h2
            className="text-xl sm:text-2xl font-black text-white"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Escribinos directamente
          </h2>
          <WhatsAppCTA
            campaignSlug={slug}
            message={campaign.whatsappMessage}
            label="Hablar con nosotros"
          />
        </motion.div>
      </section>
    </div>
  );
}
