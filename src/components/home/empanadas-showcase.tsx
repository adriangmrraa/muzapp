"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Empanada = {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
};

export function EmpanadasShowcase() {
  const [products, setProducts] = useState<Empanada[]>([]);

  useEffect(() => {
    fetch("/api/products?available=true&category=empanadas")
      .then((response) => response.ok ? response.json() : [])
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  if (!products.length) return null;

  return (
    <section className="bg-[#0a0a0a] px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Recién salidas</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl" style={{ fontFamily: "var(--font-playfair), serif" }}>
              Empanadas para compartir
            </h2>
            <p className="mt-3 max-w-xl text-white/60">Elegí tu variedad y consultanos el precio y la disponibilidad por WhatsApp.</p>
          </div>
          <Link href="/carta-digital?category=empanadas" className="inline-flex w-fit items-center rounded-full border border-amber-400/35 px-5 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-400/10">
            Ver carta de empanadas
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {products.map((product, index) => (
            <motion.article
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="rounded-2xl border border-amber-400/15 bg-white/[0.03] p-5"
            >
              <span className="text-4xl" aria-hidden>🥟</span>
              <h3 className="mt-5 text-lg font-bold text-white">{product.name}</h3>
              {product.description && <p className="mt-2 text-sm leading-relaxed text-white/55">{product.description}</p>}
              <p className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-300">
                {product.price === null ? "Precio a consultar" : `$${Number(product.price).toLocaleString("es-AR")}`}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
