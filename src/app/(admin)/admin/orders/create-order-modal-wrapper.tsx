"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateOrderModal } from "@/components/orders/create-order-modal";

export function CreateOrderModalWrapper() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4A017] text-black text-xs font-semibold hover:bg-[#F5A623] transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Nuevo Pedido
      </button>
      <CreateOrderModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
