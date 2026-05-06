"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductToggle } from "@/components/products/product-toggle";
import { LINEA_POLLO, LINEA_CARNE, FEATURED_PRODUCT_IDS } from "@/lib/constants";
import { fadeUp } from "@/lib/animation-variants";

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

export function FeaturedProductsSection() {
  const [linea, setLinea] = useState<"pollo" | "carne">("pollo");
  const [products, setProducts] = useState<ProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?available=true");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.warn("[FeaturedProductsSection] API unavailable, using fallback", err);
        setError(true);
        // Fallback to constants
        const fallback = linea === "pollo" ? LINEA_POLLO : LINEA_CARNE;
        const mapped = fallback.map((p, i) => ({
          id: i,
          name: p.name,
          description: p.ingredients,
          price: p.price ? `$${p.price}` : null,
          category: linea === "pollo" ? "hamburguesa" : "hamburguesa",
          line: linea,
          imageUrl: null,
          available: !p.comingSoon,
          comingSoon: p.comingSoon || false,
          sortOrder: i,
        }));
        setProducts(mapped);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [linea]);

  // Filter featured for pollo line
  const featuredIds = FEATURED_PRODUCT_IDS;
  const filteredProducts = linea === "pollo"
    ? products.filter((p) => featuredIds.includes(p.id.toString()) || p.sortOrder < 4)
    : products;

  return (
    <section className="py-20 sm:py-24 px-4 bg-[#0a0a0a] relative">
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
            <ProductToggle value={linea} onChange={(v) => setLinea(v as "pollo" | "carne")} />
          </div>
        </motion.div>

        <ProductGrid products={filteredProducts} />
      </div>
    </section>
  );
}
