"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { LINEA_POLLO, LINEA_CARNE, WHATSAPP_MESSAGES } from "@/lib/constants";
import { buildWhatsAppURL } from "@/lib/whatsapp";

export default function HamburguesasPage() {
  const [linea, setLinea] = useState<"pollo" | "carne">("pollo");

  const products = linea === "pollo" ? LINEA_POLLO : LINEA_CARNE;
  const whatsappUrl = buildWhatsAppURL(WHATSAPP_MESSAGES.hamburguesas);

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
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hacer Pedido
          </a>
        </div>
      </div>
    </div>
  );
}
