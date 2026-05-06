"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  fadeUp,
  staggerContainer,
  cardEntrance,
  heroChild,
} from "@/lib/animation-variants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxDivider } from "@/components/layout/parallax-divider";
import { SellerBadge } from "@/components/ui/seller-badge";

type ProductFromAPI = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  category: string;
  line: string;
  imageUrl: string | null;
  available: boolean;
  comingSoon: boolean;
  sortOrder: number;
};

const BREAD_IMAGES: Record<string, string> = {
  "pan-brioche":
    "/assets/images/pan-mayorista/097707a3-f17b-4399-a6d0-66f6457ee64a.jpg",
  "pan-semillas":
    "/assets/images/pan-mayorista/5ee3b05e-fb3b-4bbc-a17f-67ceaeb509eb.jpg",
  "pan-integral":
    "/assets/images/pan-mayorista/4f61b737-04bf-42d9-b033-a958cd791f6a.jpg",
  "pan-papa":
    "/assets/images/pan-mayorista/5c80c0c3-b27e-4b30-94a2-88a6f2981bca.jpg",
};

const benefits = [
  {
    icon: "🏆",
    title: "Calidad Premium",
    description:
      "Elaboración artesanal con harinas seleccionadas y procesos de fermentación lenta para un sabor y textura sin igual.",
  },
  {
    icon: "📦",
    title: "Precios por Bulto",
    description:
      "Precios competitivos en pedidos mayoristas. Trabajamos con restaurantes, hamburgueserías y cocinas de todo tipo.",
  },
  {
    icon: "🚚",
    title: "Entrega Confiable",
    description:
      "Cumplimos con los plazos acordados. Tu cocina nunca se queda sin pan cuando trabajás con nosotros.",
  },
  {
    icon: "🤝",
    title: "Relación Directa",
    description:
      "Sin intermediarios. Hablás directo con quien hace el pan. Adaptamos formatos y cantidades a tu negocio.",
  },
];

export default function PanMayoristaPage() {
  const [products, setProducts] = useState<ProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?available=true");
        const data = await res.json();
        // Filter for pan mayorista
        const panProducts = data.filter((p: ProductFromAPI) => p.category === "pan_mayorista");
        setProducts(panProducts);
      } catch (err) {
        console.error("[pan-mayorista] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Hero */}
      <PageHero backgroundImage="/assets/images/pan-muzzarella.jpeg">
        <motion.span
          variants={heroChild}
          className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
          style={{
            background: "rgba(212,160,23,0.1)",
            border: "1px solid rgba(212,160,23,0.3)",
            color: "#D4A017",
          }}
        >
          Servicio Mayorista
        </motion.span>

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
          Pan Artesanal
          <br />
          para tu Negocio
        </motion.h1>

        <motion.p
          variants={heroChild}
          className="text-lg text-white/65 max-w-2xl leading-relaxed"
        >
          Proveemos pan artesanal de calidad premium para restaurantes,
          hamburgueserías y cocinas profesionales. Sin conservantes, con
          fermentación lenta y el sabor que tus clientes van a notar.
        </motion.p>

        <motion.div variants={heroChild} className="mt-2">
          <SellerBadge />
        </motion.div>

        <motion.div variants={heroChild}>
          <WhatsAppCTA
            campaignSlug="mayorista"
            message="Hola! Me interesa información sobre pan mayorista"
            label="Consultá Precios y Disponibilidad"
            className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest mt-4"
          />
        </motion.div>
      </PageHero>

      {/* Benefits grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-center text-2xl sm:text-3xl font-black text-white mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            Por qué elegirnos
          </motion.h2>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.title}
                variants={cardEntrance}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 0 24px rgba(212,160,23,0.2)",
                }}
                className="flex flex-col gap-3 p-6 rounded-2xl transition-colors duration-300 cursor-default"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,160,23,0.3)",
                }}
              >
                <span className="text-3xl">{benefit.icon}</span>
                <h3
                  className="font-bold text-base"
                  style={{
                    background: "linear-gradient(135deg, #D4A017, #F5A623)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {benefit.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Parallax divider between benefits and products */}
      <ParallaxDivider image="/assets/images/background/2.png" height="40vh" />

      {/* Products */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Nuestras Variedades
            </h2>
            <p className="text-white/50 text-sm">
              Todos los precios son por bulto cerrado. Consultá disponibilidad y
              pedido mínimo.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {products.map((bread) => (
              <motion.div
                key={bread.id}
                variants={cardEntrance}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 0 24px rgba(212,160,23,0.2)",
                }}
                className="flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,160,23,0.3)",
                }}
              >
                {/* Real bread image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  {BREAD_IMAGES[bread.id] ? (
                    <Image
                      src={BREAD_IMAGES[bread.id]}
                      alt={bread.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-5xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(232,113,42,0.07) 100%)",
                      }}
                    >
                      <span role="img" aria-label={bread.name}>
                        🍞
                      </span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)",
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2 p-5">
                  <h3
                    className="font-bold text-base"
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {bread.name}
                  </h3>
                  <p className="text-xs text-white/55 leading-relaxed">
                    {bread.description}
                  </p>
                  <WhatsAppCTA
                    campaignSlug="mayorista"
                    message="Hola! Me interesa información sobre pan mayorista"
                    label="Consultar Precio"
                    className="mt-3 text-center text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-full transition-all duration-200 hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Parallax divider between products and final CTA */}
      <ParallaxDivider image="/assets/images/background/b4.png" height="35vh" />

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            className="rounded-3xl p-10 flex flex-col items-center gap-5"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            whileHover={{
              boxShadow: "0 0 40px rgba(212,160,23,0.15)",
            }}
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(212,160,23,0.3)",
            }}
          >
            <span className="text-4xl">🤝</span>
            <h2
              className="text-2xl sm:text-3xl font-black"
              style={{
                fontFamily: "var(--font-playfair), serif",
                background:
                  "linear-gradient(135deg, #D4A017 0%, #F5A623 50%, #E8712A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ¿Listo para trabajar juntos?
            </h2>
            <p className="text-white/60 leading-relaxed max-w-lg">
              Escribinos por WhatsApp y te respondemos en el día. Armamos una
              propuesta adaptada a tu volumen y necesidades.
            </p>
            <WhatsAppCTA
              campaignSlug="mayorista"
              message="Hola! Me interesa información sobre pan mayorista"
              label="Escribinos por WhatsApp"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
