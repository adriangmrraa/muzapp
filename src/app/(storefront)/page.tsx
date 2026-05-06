"use client";

import { motion } from "framer-motion";
import { HeroSection } from "@/components/hero/hero-section";
import { FeaturedProductsSection } from "@/components/products/featured-products-section";
import { GlassPanel } from "@/components/ui/glass-panel";
import { AnimatedStatCard } from "@/components/ui/animated-stat-card";
import { fadeUp } from "@/lib/animation-variants";
import Link from "next/link";
import { ClientGallery } from "@/components/home/client-gallery";
import { BreadShowcase } from "@/components/home/bread-showcase";
import { DeliveryCTA } from "@/components/home/delivery-cta";

const STATS = [
  { value: "100%", label: "Ingredientes frescos" },
  { value: "6+", label: "Variedades de hamburguesa" },
  { value: "Pan", label: "Artesanal propio" },
  { value: "♥", label: "Hecho con amor" },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <FeaturedProductsSection />

      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <GlassPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <motion.div
                className="flex flex-col gap-5"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-[0.3em]"
                  style={{ color: "#D4A017" }}
                >
                  Sobre Nosotros
                </span>
                <h2
                  className="text-3xl sm:text-4xl font-black text-white leading-tight"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Más que una{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    hamburguesa
                  </span>
                </h2>
                <p className="text-white/65 leading-relaxed">
                  En Mrs Muzzarella creemos que cada ingrediente importa. Trabajamos con productores locales, elaboramos nuestro propio pan y preparamos cada hamburguesa al momento. Sin compromiso. Sin atajos.
                </p>
                <p className="text-white/65 leading-relaxed">
                  También proveemos pan artesanal a restaurantes y cocinas que, como nosotros, no se conforman con lo mediocre.
                </p>
                <div className="flex gap-4 mt-2">
                  <Link
                    href="/hamburguesas"
                    className="btn-gold inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-widest"
                  >
                    Ver Menú
                  </Link>
                  <Link
                    href="/pan-mayorista"
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold uppercase tracking-widest rounded-full transition-all duration-300 hover:scale-105"
                    style={{
                      background: "rgba(212,160,23,0.08)",
                      border: "1px solid rgba(212,160,23,0.3)",
                      color: "#D4A017",
                    }}
                  >
                    Pan Mayorista
                  </Link>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                {STATS.map((stat) => (
                  <AnimatedStatCard key={stat.label} value={stat.value} label={stat.label} />
                ))}
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      <ClientGallery />
      <BreadShowcase />
      <DeliveryCTA />
    </>
  );
}
