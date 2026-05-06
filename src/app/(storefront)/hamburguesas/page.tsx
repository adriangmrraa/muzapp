"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { LINEA_POLLO, LINEA_CARNE } from "@/lib/constants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";
import { fadeUp, staggerContainer, heroChild } from "@/lib/animation-variants";
import { PageHero } from "@/components/layout/page-hero";
import { ParallaxDivider } from "@/components/layout/parallax-divider";

export default function HamburguesasPage() {
  const [linea, setLinea] = useState<"pollo" | "carne">("pollo");

  const products = linea === "pollo" ? LINEA_POLLO : LINEA_CARNE;

  return (
    <>
      <PageHero backgroundImage="/assets/images/background/1.png">
        <motion.div
          className="flex flex-col items-center text-center gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.span
            variants={heroChild}
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#D4A017" }}
          >
            El Menú
          </motion.span>
          <motion.h1
            variants={heroChild}
            className="text-4xl sm:text-5xl font-black"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background:
                "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nuestras Hamburguesas
          </motion.h1>
          <motion.p
            variants={heroChild}
            className="text-white/60 max-w-lg leading-relaxed"
          >
            Cada una tiene su propia historia. Elegí tu línea y descubrí la que te va a conquistar.
          </motion.p>

          <motion.div variants={heroChild} className="mt-4">
            <ProductToggle value={linea} onChange={setLinea} />
          </motion.div>
        </motion.div>
      </PageHero>

      <div className="bg-[#0a0a0a] relative pb-20 px-4">
        <div className="max-w-7xl mx-auto pt-16">
          <ProductGrid products={products} />
        </div>
      </div>

      <ParallaxDivider image="/assets/images/background/3.png" height="35vh" />

      <div className="bg-[#0a0a0a] py-16 px-4">
        <motion.div
          className="max-w-7xl mx-auto flex flex-col items-center gap-4 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <p className="text-white/60 text-sm">
            ¿Ya elegiste? Hacé tu pedido directo por WhatsApp
          </p>
          <WhatsAppCTA
            campaignSlug="hamburguesas"
            message="Hola! Me gustaría hacer un pedido de hamburguesas"
            label="Hacer Pedido"
          />
        </motion.div>
      </div>
    </>
  );
}
