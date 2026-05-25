"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, X, Save } from "lucide-react";
import { updateClient } from "../actions";

interface LeadData {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: string | null;
  type: string | null;
  tags: string[] | null;
  platform: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}

export function ClientEditForm({ lead }: { lead: LeadData | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(lead?.name ?? "");
  const [phone, setPhone] = useState(lead?.phone ?? "");
  const [email, setEmail] = useState(lead?.email ?? "");
  const [address, setAddress] = useState(lead?.address ?? "");
  const [notes, setNotes] = useState(lead?.notes ?? "");
  const [type, setType] = useState(lead?.type ?? "");
  const [tagsStr, setTagsStr] = useState((lead?.tags ?? []).join(", "));

  if (!lead) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = tagsStr.split(",").map((t) => t.trim()).filter(Boolean);

      await updateClient(phone, {
        name,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
        type: (type === "b2c" || type === "b2b") ? type : null,
        tags: tags.length > 0 ? tags : undefined,
      });

      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const fieldClass = "w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-200 focus:outline-none focus:border-[#D4A017]/40";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors"
      >
        <Edit className="h-3 w-3" />
        Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <span className="text-sm font-semibold text-neutral-200">Editar Cliente</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-neutral-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Nombre</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Teléfono</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-semibold">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-semibold">Dirección</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={fieldClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Tipo</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={fieldClass}>
                    <option value="">—</option>
                    <option value="b2c">B2C (Consumidor)</option>
                    <option value="b2b">B2B (Mayorista)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-500 uppercase font-semibold">Tags</label>
                  <input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="ej: frecuente, delivery" className={fieldClass} />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 uppercase font-semibold">Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={fieldClass + " resize-none"} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} disabled={saving} className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#D4A017] text-black hover:bg-[#F5A623] transition-colors disabled:opacity-40">
                <Save className="h-3 w-3" />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
