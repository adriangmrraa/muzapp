"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

const STORAGE_KEY = "muzapp-upsell-shown";

interface UpsellModalProps {
  /** Función para scrollear/highlight la sección de papas */
  onNavigateToPapas?: () => void;
}

export function UpsellModal({ onNavigateToPapas }: UpsellModalProps) {
  const [show, setShow] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    // Mostrar después de 5 segundos si no se mostró ya en esta sesión
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setShow(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleAddCoca = () => {
    addItem({ id: "coca-cola", name: "Coca-Cola", price: 1500, emoji: "🥤" });
    setShow(false);
  };

  const handleAddPapas = () => {
    addItem({ id: "papas-fritas", name: "Papas Fritas", price: 2800, emoji: "🍟" });
    setShow(false);
    onNavigateToPapas?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShow(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] rounded-2xl border border-[#D4A017]/20 bg-[#0f0f0f] p-5 shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={() => setShow(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#D4A017]" />
              <p className="text-sm font-medium text-neutral-200">
                ¿Te falta el combo perfecto?
              </p>
            </div>
            <p className="text-xs text-neutral-500 mb-5">
              Añade el toque final a tu pedido
            </p>

            {/* Options */}
            <div className="flex gap-3">
              {/* Coca-Cola */}
              <button
                onClick={handleAddCoca}
                className="flex-1 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#D4A017]/40 hover:bg-white/[0.06] transition-all group"
              >
                <span className="text-3xl">🥤</span>
                <span className="text-xs font-medium text-neutral-200">Coca-Cola</span>
                <span className="text-xs text-[#D4A017] font-semibold">$1.500</span>
                <span className="flex items-center gap-1 text-[10px] text-[#D4A017]/70 group-hover:text-[#D4A017] transition-colors">
                  <ShoppingCart className="h-3 w-3" />
                  Añadir
                </span>
              </button>

              {/* Papas Fritas */}
              <button
                onClick={handleAddPapas}
                className="flex-1 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#D4A017]/40 hover:bg-white/[0.06] transition-all group"
              >
                <span className="text-3xl">🍟</span>
                <span className="text-xs font-medium text-neutral-200">Papas Fritas</span>
                <span className="text-xs text-[#D4A017] font-semibold">$2.800</span>
                <span className="flex items-center gap-1 text-[10px] text-[#D4A017]/70 group-hover:text-[#D4A017] transition-colors">
                  <ShoppingCart className="h-3 w-3" />
                  Añadir
                </span>
              </button>
            </div>

            {/* Skip */}
            <button
              onClick={() => setShow(false)}
              className="w-full mt-4 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              No, gracias
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
