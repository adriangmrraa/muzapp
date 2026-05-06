"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { LINEA_POLLO, LINEA_CARNE, FEATURED_PRODUCT_IDS } from "@/lib/constants";
import { fadeUp } from "@/lib/animation-variants";

export function FeaturedProductsSection() {
  const [linea, setLinea] = useState<"pollo" | "carne">("pollo");
  const allProducts = linea === "pollo" ? LINEA_POLLO : LINEA_CARNE;
  const products = linea === "pollo"
    ? allProducts.filter((p) => FEATURED_PRODUCT_IDS.includes(p.id))
    : allProducts;

  return (
    <section className="py-24 px-4 sticky top-20 z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="flex flex-col items-center text-center gap-4 mb-12"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: "#D4A017" }}
          >
            Productos Destacados
          </span>
          <h2
            className="text-3xl sm:text-4xl font-black leading-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nuestras Favoritas
          </h2>
          <p className="text-white/60 max-w-lg leading-relaxed">
            Las hamburguesas que el ama de casa (nuestra mejor jueza) recomienda.
          </p>
          <div className="mt-2">
            <ProductToggle value={linea} onChange={setLinea} />
          </div>
        </motion.div>

        <ProductGrid products={products} />
      </div>
    </section>
  );
}
