"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductDetail } from "@/components/products/product-detail";
import type { Product } from "@/lib/constants";
import { BREAD_PRODUCTS } from "@/lib/constants";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    // Find product in existing data
    const found = BREAD_PRODUCTS.find(p => p.id === productId);
    
    if (found) {
      setProduct({
        ...found,
        price: null,
        ingredients: found.description,
      });
    } else {
      setError("Producto no encontrado");
    }
    setLoading(false);
  }, [productId]);

  function handleAddToCart(p: Product) {
    console.log("Added to cart:", p.name);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/[0.04] rounded w-24" />
            <div className="h-96 bg-white/[0.04] rounded-2xl" />
            <div className="h-32 bg-white/[0.04] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error ?? "Producto no encontrado"}</p>
          <button
            onClick={() => router.push("/pan-mayorista")}
            className="text-amber-400 hover:underline text-sm"
          >
            Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 pb-20">
      <ProductDetail product={product} onAddToCart={handleAddToCart} />
    </div>
  );
}