"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { createManualOrder } from "@/app/(admin)/admin/orders/create-order-action";

interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-cargar datos del cliente */
  clientName?: string;
  clientPhone?: string;
}

type ProductoDisponible = {
  id: number;
  name: string;
  price: string | null;
  category: string;
};

export function CreateOrderModal({ open, onClose, clientName, clientPhone }: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState(clientName || "");
  const [customerPhone, setCustomerPhone] = useState(clientPhone || "");
  const [orderType, setOrderType] = useState<"hamburguesas" | "pan_mayorista">("hamburguesas");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<ProductoDisponible[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCustomerName(clientName || "");
    setCustomerPhone(clientPhone || "");
  }, [clientName, clientPhone]);

  useEffect(() => {
    fetch("/api/products?available=true")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) {
      setItems([]);
      setAddress("");
      setNotes("");
      setDone(false);
      setOrderType("hamburguesas");
    }
  }, [open]);

  const addItem = (name: string, price: string | null) => {
    const p = price ? parseFloat(price.replace(/[^0-9]/g, "")) : 0;
    setItems((prev) => {
      const ex = prev.find((i) => i.name === name);
      if (ex) return prev.map((i) => (i.name === name ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { name, quantity: 1, unitPrice: p }];
    });
  };

  const updateQty = (name: string, qty: number) => {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.name !== name));
      return;
    }
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, quantity: qty } : i)));
  };

  const removeItem = (name: string) => {
    setItems((prev) => prev.filter((i) => i.name !== name));
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSave = async () => {
    if (!customerName || !customerPhone || items.length === 0) return;
    setSaving(true);
    const result = await createManualOrder({
      customerName,
      customerPhone,
      orderType,
      items,
      address: address || null,
      notes: notes || null,
    });
    setSaving(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => { onClose(); setDone(false); }, 1500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-50 inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[85vh] bg-[#0f0f0f] border border-white/10 rounded-2xl flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#D4A017]" />
                <span className="text-sm font-semibold text-neutral-200">Nuevo Pedido</span>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-neutral-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {done ? (
              <div className="flex-1 flex items-center justify-center py-16">
                <p className="text-emerald-400 font-medium">✅ Pedido creado</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Cliente */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-semibold">Nombre</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 focus:outline-none focus:border-[#D4A017]/40" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-semibold">Teléfono</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 focus:outline-none focus:border-[#D4A017]/40" />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Tipo</label>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setOrderType("hamburguesas")}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${orderType === "hamburguesas" ? "bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30" : "bg-white/5 text-neutral-400 border border-white/10"}`}>
                      🍔 Hamburguesas
                    </button>
                    <button onClick={() => setOrderType("pan_mayorista")}
                      className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${orderType === "pan_mayorista" ? "bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30" : "bg-white/5 text-neutral-400 border border-white/10"}`}>
                      🍞 Pan Mayorista
                    </button>
                  </div>
                </div>

                {/* Productos disponibles */}
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Productos</label>
                  <div className="flex flex-wrap gap-1.5 mt-1 max-h-32 overflow-y-auto">
                    {products.filter(p => p.category !== "pan_mayorista" || orderType === "pan_mayorista").map((p) => (
                      <button key={p.id} onClick={() => addItem(p.name, p.price)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-neutral-300 hover:border-[#D4A017]/30 hover:bg-[#D4A017]/5 transition-colors">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items del pedido */}
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Items ({items.length})</label>
                  {items.length === 0 ? (
                    <p className="text-xs text-neutral-600 mt-2 italic">Seleccioná productos arriba</p>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {items.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 bg-white/[0.03] rounded-lg px-3 py-2">
                          <span className="flex-1 text-xs text-neutral-200 truncate">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.name, item.quantity - 1)} className="p-0.5 rounded hover:bg-white/10 text-neutral-500"><Minus className="h-3 w-3" /></button>
                            <span className="text-xs text-neutral-200 w-5 text-center">{item.quantity}</span>
                            <button onClick={() => updateQty(item.name, item.quantity + 1)} className="p-0.5 rounded hover:bg-white/10 text-neutral-500"><Plus className="h-3 w-3" /></button>
                          </div>
                          <span className="text-xs text-neutral-400 w-16 text-right">${(item.quantity * item.unitPrice).toLocaleString("es-AR")}</span>
                          <button onClick={() => removeItem(item.name)} className="p-0.5 rounded hover:bg-red-500/20 text-neutral-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-2 border-t border-white/5">
                  <span className="text-xs text-neutral-500">Total</span>
                  <span className="text-sm font-bold text-[#D4A017]">${total.toLocaleString("es-AR")}</span>
                </div>

                {/* Dirección + Notas */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-semibold">Dirección</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Opcional"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 focus:outline-none focus:border-[#D4A017]/40" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 uppercase font-semibold">Notas</label>
                    <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 focus:outline-none focus:border-[#D4A017]/40" />
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !customerName || !customerPhone || items.length === 0}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#D4A017] text-black hover:bg-[#F5A623] transition-colors disabled:opacity-40">
                {saving ? "Creando..." : "Crear Pedido"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
