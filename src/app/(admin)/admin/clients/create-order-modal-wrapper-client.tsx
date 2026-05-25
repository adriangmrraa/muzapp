"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateOrderModal } from "@/components/orders/create-order-modal";

interface Props {
  clientName?: string;
  clientPhone?: string;
}

export function CreateOrderModalWrapperClient({ clientName, clientPhone }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-[#D4A017] border border-[#D4A017]/30 px-3.5 py-2 text-xs font-medium text-black hover:bg-[#F5A623] transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Nuevo Pedido
      </button>
      <CreateOrderModal open={open} onClose={() => setOpen(false)} clientName={clientName} clientPhone={clientPhone} />
    </>
  );
}
