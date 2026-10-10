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
import { EmpanadasShowcase } from "@/components/home/empanadas-showcase";
import { ParallaxDivider } from "@/components/layout/parallax-divider";
import { Marquee } from "@/components/motion/marquee";
import { useBusiness } from "@/lib/hooks/use-business";

const MARQUEE_ITEMS = [
  "Hamburguesas artesanales",
  "Pan de elaboración propia",
  "Ingredientes frescos",
  "Hecho al momento",
  "Envío a domicilio",
];

const STATS = [
  { value: "100%", label: "Ingredientes frescos" },
  { value: "6+", label: "Variedades de hamburguesa" },
  { value: "Pan", label: "Artesanal propio" },
  { value: "♥", label: "Hecho con amor" },
];

export default function HomePage() {
  const business = useBusiness();
  const marqueeItems = business?.tagline
    ? [...MARQUEE_ITEMS, business.tagline]
    : MARQUEE_ITEMS;
  return (
    <>
      <div className="paint-veil" aria-hidden="true" />
      <HeroSection />

      <Marquee items={marqueeItems} />

      <FeaturedProductsSection />

      <ParallaxDivider image="/assets/images/background/2.png" />

      <section className="py-20 sm:py-24 px-4 bg-background relative overflow-hidden">
        <div className="orb-glow orb-1" style={{ width: "450px", height: "450px", background: "radial-gradient(circle, rgba(212,160,23,0.08), transparent 70%)", top: "-10%", right: "-5%" }} />
        <div className="orb-glow orb-2" style={{ width: "350px", height: "350px", background: "radial-gradient(circle, rgba(232,113,42,0.06), transparent 70%)", bottom: "-15%", left: "-5%" }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <GlassPanel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <motion.div
                className="flex flex-col gap-5"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                  Sobre Nosotros
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight font-heading">
                  Más que una{" "}
                  <span className="text-gold-gradient">
                    hamburguesa
                  </span>
                </h2>
                <p className="text-foreground/65 leading-relaxed">
                  {business?.description ||
                    `En ${business?.name ?? "nuestra cocina"} creemos que cada ingrediente importa. Trabajamos con productores locales, elaboramos nuestro propio pan y preparamos cada hamburguesa al momento. Sin compromiso. Sin atajos.`}
                </p>
                <p className="text-foreground/65 leading-relaxed">
                  También proveemos pan artesanal a restaurantes y cocinas que, como nosotros, no se conforman con lo mediocre.
                </p>
                <div className="flex gap-4 mt-2">
                  <Link
                    href="/hamburguesas"
                    className="btn-gold shine-sweep inline-flex items-center justify-center px-6 py-3 text-sm font-bold uppercase tracking-widest"
                  >
                    Ver Menú
                  </Link>
                  <Link
                    href="/pan-mayorista"
                    className="btn-outline-gold shine-sweep px-6 py-3 text-sm uppercase tracking-widest"
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

      <ParallaxDivider image="/assets/images/background/3.png" height="45vh" overlay={0.6}>
        <p
          className="text-xl sm:text-2xl font-black text-foreground text-center max-w-xl mx-auto px-6 leading-snug font-heading"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
        >
          &quot;Cada mordida cuenta una historia.{" "}
          <span className="text-primary">La nuestra empieza con ingredientes reales.&quot;</span>
        </p>
      </ParallaxDivider>

      <ClientGallery />
      <BreadShowcase />
      <EmpanadasShowcase />

      {/* Digital Menu CTA */}
      <section className="py-16 px-4 bg-background relative overflow-hidden">
        <div className="orb-glow orb-1" style={{ width: "400px", height: "400px", background: "radial-gradient(circle, rgba(212,160,23,0.07), transparent 70%)", top: "-20%", left: "10%" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            className="glass-card rounded-3xl p-10 flex flex-col items-center gap-4"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{ boxShadow: "0 0 40px rgba(212,160,23,0.12)" }}
          >
            <span className="text-5xl">📱</span>
            <h2 className="text-2xl sm:text-3xl font-black font-heading text-gold-gradient">
              Carta Digital
            </h2>
            <p className="text-foreground/60 max-w-md leading-relaxed">
              Deslizá todos nuestros productos, armá tu pedido y enviá directo por WhatsApp. Rápido y sin vueltas.
            </p>
            <a href="/carta-digital"
              className="shine-sweep inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105 bg-gradient-to-br from-gold to-gold-bright text-primary-foreground">
              📲 Abrir Carta Digital
            </a>
          </motion.div>
        </div>
      </section>

      <ParallaxDivider image="/assets/images/background/b4.png" height="40vh" />

      <DeliveryCTA />
    </>
  );
}
