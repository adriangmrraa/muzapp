"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { LINEA_POLLO, LINEA_CARNE } from "@/lib/constants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";

export default function HamburguesasPage() {
  const [linea, setLinea] = useState<"pollo" | "carne">("pollo");

  const products = linea === "pollo" ? LINEA_POLLO : LINEA_CARNE;

  return (
    <div
      className="min-h-screen pt-24 pb-20 px-4"
      style={{
        background:
          "radial-gradient(ellipse at 80% 20%, rgba(212,160,23,0.08) 0%, transparent 50%), #0a0a0a",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <span
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#D4A017" }}
          >
            El Menú
          </span>
          <h1
            className="text-4xl sm:text-5xl font-black"
            style={{
              background:
                "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nuestras Hamburguesas
          </h1>
          <p className="text-white/60 max-w-lg leading-relaxed">
            Cada una tiene su propia historia. Elegí tu línea y descubrí la que te va a conquistar.
          </p>

          {/* Toggle */}
          <div className="mt-4">
            <ProductToggle value={linea} onChange={setLinea} />
          </div>
        </div>

        {/* Product grid */}
        <ProductGrid products={products} />

        {/* CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-white/60 text-sm">
            ¿Ya elegiste? Hacé tu pedido directo por WhatsApp
          </p>
          <WhatsAppCTA
            campaignSlug="hamburguesas"
            message="Hola! Me gustaría hacer un pedido de hamburguesas"
            label="Hacer Pedido"
          />
        </div>
      </div>
    </div>
  );
}
