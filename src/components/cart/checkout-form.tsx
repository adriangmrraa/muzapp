"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, LoaderCircle, Check } from "lucide-react";
import { checkoutSchema, type CheckoutLine, type CheckoutReceipt } from "@/lib/checkout/contract";

export function CheckoutForm({ items }: { items: CheckoutLine[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null);
  const inFlight = useRef(false);
  const attempt = useRef<{ signature: string; requestId: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !items.length) return;
    setError("");
    const signature = JSON.stringify({ customerName: name.trim(), phone, items });
    // Keep the same key after lost responses, remounts and page reloads.
    if (attempt.current?.signature !== signature) {
      try {
        const saved = JSON.parse(sessionStorage.getItem("muzapp-checkout-attempt") || "null");
        attempt.current = saved?.signature === signature && typeof saved?.requestId === "string" ? saved : { signature, requestId: crypto.randomUUID() };
      } catch { attempt.current = { signature, requestId: crypto.randomUUID() }; }
    }
    const parsed = checkoutSchema.safeParse({ requestId: attempt.current!.requestId, customerName: name, phone, items });
    if (!parsed.success) { setError("Ingresá tu nombre y WhatsApp con código de área, sin 0 ni 15. Ejemplo: 370 4123456."); return; }
    try { sessionStorage.setItem("muzapp-checkout-attempt", JSON.stringify(attempt.current)); } catch { /* session memory still protects retries */ }
    inFlight.current = true; setBusy(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos registrar el pedido.");
      setReceipt(data);
      // Same-tab navigation works after async persistence without popup permissions.
      window.location.assign(data.whatsappUrl);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos conectar. Reintentá desde este pedido."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (receipt) return <div className="checkout-confirmation" role="status">
    <Check size={20} /><strong>Pedido #{receipt.orderId} registrado</strong>
    <p>Subtotal confirmado: ${receipt.total.toLocaleString("es-AR")}. Enviá el mensaje para coordinar entrega y pago.</p>
    <a className="menu-whatsapp-button" href={receipt.whatsappUrl}>Continuar en WhatsApp <ArrowUpRight size={18} /></a>
  </div>;
  return <form className="checkout-form" onSubmit={submit}>
    <div className="checkout-fields">
      <label>Tu nombre<input name="name" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} disabled={busy} placeholder="¿Cómo te llamás?" /></label>
      <label>Tu WhatsApp<input name="tel" type="tel" autoComplete="tel" required maxLength={30} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} placeholder="370 4123456" aria-describedby="checkout-phone-help" /></label>
    </div>
    <p id="checkout-phone-help" className="menu-cart-note">Usá el número desde el que vas a escribirnos para que reconozcamos tu pedido.</p>
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <button className="menu-whatsapp-button" type="submit" disabled={busy || !items.length}>
      {busy ? <><LoaderCircle className="animate-spin" size={18} /> Registrando pedido…</> : <>Confirmar y abrir WhatsApp <ArrowUpRight size={18} /></>}
    </button>
    <p className="menu-cart-note">El pedido queda registrado al confirmar. En WhatsApp, tocá Enviar para hablar con nuestro asistente.</p>
  </form>;
}
