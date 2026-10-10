"use client";

import type { Product } from "@/lib/constants";
import { ProductCard } from "./product-card";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animation-variants";

type ApiProduct = {
  id: number | string;
  name: string;
  price: string | number | null;
  description?: string | null;
  isPromo?: boolean;
  promoPrice?: string | null;
  stock?: number | null;
  imageUrl?: string | null;
  comingSoon?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  hasFreeShipping?: boolean;
  soldCount?: number;
};

interface ProductGridProps {
  products: Array<Product | ApiProduct>;
}

export function ProductGrid({ products }: ProductGridProps) {
  // Las páginas públicas reciben productos desde dos fuentes: constantes locales
  // y la API (donde numeric llega como string). ProductCard necesita un formato único.
  const normalized: Product[] = products.map((product) => {
    const rawPrice = "isPromo" in product && product.isPromo && product.promoPrice != null ? product.promoPrice : product.price;
    const parsedPrice = typeof rawPrice === "number" ? rawPrice : Number.parseFloat(rawPrice ?? "");
    return {
      id: String(product.id),
      name: product.name,
      price: Number.isFinite(parsedPrice) ? parsedPrice : null,
      ingredients:
        ("ingredients" in product ? product.ingredients : undefined) ||
        ("description" in product ? product.description : undefined) ||
        "",
      emoji: ("emoji" in product ? product.emoji : undefined) || "🍔",
      imageUrl: product.imageUrl || null,
      comingSoon: Boolean(product.comingSoon),
      stock: "stock" in product ? product.stock ?? null : null,
      discountPercentage: product.discountPercentage,
      originalPrice: product.originalPrice,
      hasFreeShipping: product.hasFreeShipping,
      soldCount: product.soldCount,
    };
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
        <p className="text-foreground/40 text-lg">No hay productos disponibles</p>
      </div>
    )}
    </motion.div>
  );
}
