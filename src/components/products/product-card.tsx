"use client";

import type { Product } from "@/lib/constants";
import { PRODUCT_IMAGE_MAP } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTilt } from "@/hooks/use-tilt";
import { cardEntrance } from "@/lib/animation-variants";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index?: number;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({ maxAngle: 8 });
  const imageSrc = PRODUCT_IMAGE_MAP[product.id];

  return (
    <Link href={`/hamburguesas/${product.id}`}>
      <motion.div
        ref={ref}
        variants={cardEntrance}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          ...style,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(212,160,23,0.3)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        }}
        className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 group hover:shadow-[0_0_30px_rgba(212,160,23,0.3)]"
      >
        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
          {product.comingSoon && (
            <span
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                background: "rgba(212,160,23,0.15)",
                border: "1px solid rgba(212,160,23,0.4)",
                color: "#D4A017",
              }}
            >
              Próximamente
            </span>
          )}
          {product.discountPercentage && product.discountPercentage > 0 && (
            <span
              className="text-xs font-black uppercase tracking-tighter px-2 py-1 rounded-full"
              style={{
                background: "#D4A017",
                color: "#07120b",
              }}
            >
              {product.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Image Container */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/40">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              unoptimized={imageSrc.endsWith(".svg")}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                product.comingSoon ? "grayscale-[40%] brightness-[80%]" : ""
              }`}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl"
              style={{
                background: "linear-gradient(135deg, rgba(212,160,23,0.15) 0%, rgba(232,113,42,0.1) 100%)",
              }}
            >
              <span role="img" aria-label={product.name}>{product.emoji}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Add to Cart Button */}
          {onAddToCart && !product.comingSoon && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(212,160,23,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 z-20 border-none"
              style={{ background: "#D4A017" }}
              title="Agregar al carrito"
            >
              <ShoppingCart className="w-4 h-4 stroke-[1.5] text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-5 flex-1">
          <h3
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-playfair), serif",
              background: "linear-gradient(135deg, #D4A017, #F5A623)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {product.name}
          </h3>

          <p className="text-sm text-white/60 leading-relaxed flex-1">
            {product.ingredients}
          </p>

          {/* Pricing */}
          {product.price !== null ? (
            <div className="space-y-1 mt-2">
              {product.originalPrice && product.discountPercentage ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-amber-400">
                    {product.discountPercentage}% OFF
                  </span>
                  <span className="text-xs text-white/40 line-through">
                    ${product.originalPrice.toLocaleString("es-AR")}
                  </span>
                </div>
              ) : null}
              <p
                className="text-2xl font-black"
                style={{
                  background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ${product.price.toLocaleString("es-AR")}
              </p>
              <div className="flex items-center justify-between text-xs">
                {product.hasFreeShipping && (
                  <span className="text-amber-400/80 font-medium">Envío gratis</span>
                )}
                {product.soldCount !== undefined && product.soldCount > 0 && (
                  <span className="text-white/40">
                    +{product.soldCount} vendidos
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-white/40 mt-2 uppercase tracking-wider">
              Precio a consultar
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default ProductCard;