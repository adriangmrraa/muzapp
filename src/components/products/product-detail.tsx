"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { PRODUCT_IMAGE_MAP } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, Heart, Share2, Truck, Clock, Star } from "lucide-react";
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

interface ProductDetailProps {
  product: ProductFromAPI;
  onAddToCart?: (product: ProductFromAPI) => void;
}

export function ProductDetail({ product, onAddToCart }: ProductDetailProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const imageSrc = PRODUCT_IMAGE_MAP[product.id];

  async function handleAddToCart() {
    if (!onAddToCart || adding) return;
    setAdding(true);
    onAddToCart(product);
    setTimeout(() => setAdding(false), 500);
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Main card - glass surface like Citronela */}
      <div className="glass-surface rounded-2xl overflow-hidden border border-white/10">
        {/* Image */}
        <div className="relative h-72 sm:h-96 bg-black/40 overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              unoptimized={imageSrc.endsWith(".svg")}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              <span role="img" aria-label={product.name}>{product.emoji}</span>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          
          {/* Badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            {product.comingSoon && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400">
                Próximamente
              </span>
            )}
            {product.discountPercentage && product.discountPercentage > 0 && (
              <span className="text-xs font-black uppercase tracking-tighter px-3 py-1 rounded-full bg-amber-500 text-amber-950">
                {product.discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Heart className="w-5 h-5 text-zinc-300" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Share2 className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Category */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                Hamburguesa Artesanal
              </p>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  background: "linear-gradient(135deg, #D4A017, #F5A623)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {product.name}
              </h1>
            </div>
          </div>

          {/* Description / Ingredients */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Ingredientes
            </h2>
            <p className="text-zinc-300 leading-relaxed">
              {product.ingredients}
            </p>
          </div>

          {/* Pricing card */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">
                  Precio
                </p>
                <div className="flex items-baseline gap-2">
                  <span 
                    className="text-3xl sm:text-4xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623, #E8712A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    ${product.price?.toLocaleString("es-AR") ?? "Consultar"}
                  </span>
                </div>
              </div>

              {/* Add to Cart button */}
              {onAddToCart && !product.comingSoon && (
                <Button
                  variant="premium"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {adding ? "Agregado!" : "Agregar"}
                </Button>
              )}
            </div>

            {/* Original price with discount */}
            {product.originalPrice && product.discountPercentage && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-amber-400 font-semibold">
                  {product.discountPercentage}% DESCÚENTO
                </span>
                <span className="text-sm text-zinc-500 line-through">
                  ${product.originalPrice.toLocaleString("es-AR")}
                </span>
              </div>
            )}

            {/* Shipping info */}
            <div className="flex items-center gap-4 pt-2 border-t border-white/10">
              {product.hasFreeShipping ? (
                <div className="flex items-center gap-2 text-amber-400/80 text-sm">
                  <Truck className="w-4 h-4" />
                  <span>Envío gratis</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Truck className="w-4 h-4" />
                  <span>Envío coordinar</span>
                </div>
              )}
              {product.soldCount !== undefined && product.soldCount > 0 && (
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Star className="w-4 h-4" />
                  <span>+{product.soldCount} vendidos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seller / Restaurant info - like Citronela's seller reputation */}
      <div className="glass-surface rounded-xl p-4 mt-4 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-xl">🍔</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Mrs Muzzarella</p>
            <p className="text-sm text-zinc-400">Rotisería Premium en Formosa</p>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold">5.0</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProductDetail;