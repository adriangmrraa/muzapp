"use client";

import type { Product } from "@/lib/constants";
import { PRODUCT_IMAGE_MAP } from "@/lib/constants";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTilt } from "@/hooks/use-tilt";
import { cardEntrance } from "@/lib/animation-variants";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  const { ref, style, onMouseMove, onMouseLeave } = useTilt({ maxAngle: 8 });
  const imageSrc = PRODUCT_IMAGE_MAP[product.id];

  return (
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
      className="relative flex flex-col rounded-2xl overflow-hidden transition-shadow duration-500 group hover:shadow-[0_0_30px_rgba(212,160,23,0.3)]"
    >
      {product.comingSoon && (
        <div className="absolute top-3 right-3 z-10">
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
        </div>
      )}

      <div className="relative w-full aspect-[4/3] overflow-hidden bg-black/40">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            unoptimized={imageSrc.endsWith(".svg")}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
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
      </div>

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

        {product.price !== null ? (
          <p
            className="text-2xl font-black mt-2"
            style={{
              background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            ${product.price.toLocaleString("es-AR")}
          </p>
        ) : (
          <p className="text-sm font-semibold text-white/40 mt-2 uppercase tracking-wider">
            Precio a consultar
          </p>
        )}
      </div>
    </motion.div>
  );
}
