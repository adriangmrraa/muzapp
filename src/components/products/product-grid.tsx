"use client";

import type { Product } from "@/lib/constants";
import { ProductCard } from "./product-card";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animation-variants";

interface ProductGridProps {
  products: Product[] | any[];
}

export function ProductGrid({ products }: ProductGridProps) {
  // Normalize products from API or constants format
  const normalized = products.map((p, i) => {
    // If has 'price' as number, convert to string for ProductCard
    if (typeof p.price === "number") {
      return {
        id: String(p.id),
        name: p.name,
        price: p.price,
        ingredients: p.description || "",
        emoji: "🍔",
        comingSoon: p.comingSoon,
      };
    }
    // Already in Product format
    return p;
  });

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {normalized.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    {normalized.length === 0 && (
      <div className="col-span-full text-center py-16">
        <p className="text-white/40 text-lg">No hay productos disponibles</p>
      </div>
    )}
    </motion.div>
  );
}
