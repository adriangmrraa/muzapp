import { notFound } from "next/navigation";
import { CAMPAIGNS } from "@/lib/constants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CAMPAIGNS.filter((c) => c.active).map((c) => ({ slug: c.slug }));
}

// Campaign-specific visual config
const CAMPAIGN_META: Record<
  string,
  { headline: string; sub: string; emoji: string; badge: string }
> = {
  hamburguesas: {
    headline: "Las Hamburguesas que te vuelan la cabeza",
    sub: "Elaboradas a mano con ingredientes frescos. Sin apuro, con amor y mucho fuego.",
    emoji: "🍔",
    badge: "Menú Especial",
  },
  mayorista: {
    headline: "Pan Artesanal para tu Negocio",
    sub: "Fermentación lenta, sin conservantes. El pan que tus clientes van a notar.",
    emoji: "🍞",
    badge: "Distribución Mayorista",
  },
  "promo-muzza": {
    headline: "La Promo de Muzza que no podés perder",
    sub: "Mozzarella derretida, masa artesanal, ingredientes de primera. Por tiempo limitado.",
    emoji: "🧀",
    badge: "Promo Exclusiva",
  },
  "2x1-empanadas": {
    headline: "2x1 en Empanadas — Solo por Hoy",
    sub: "Las empanadas más buscadas del barrio. Aprovechá la promo antes que se acaben.",
    emoji: "🥟",
    badge: "Oferta Limitada",
  },
};

export default async function PromoPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = CAMPAIGNS.find((c) => c.slug === slug && c.active);
  if (!campaign) notFound();

  const meta = CAMPAIGN_META[slug] ?? {
    headline: campaign.name,
    sub: "Contactanos para más información.",
    emoji: "⭐",
    badge: "Promo",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 60% 10%, rgba(212,160,23,0.12) 0%, transparent 55%), #0a0a0a",
      }}
    >
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 pb-20">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Badge */}
          <span
            className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(212,160,23,0.12)",
              border: "1px solid rgba(212,160,23,0.35)",
              color: "#D4A017",
            }}
          >
            {meta.badge}
          </span>

          {/* Emoji */}
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(212,160,23,0.2) 0%, rgba(232,113,42,0.12) 100%)",
              border: "1px solid rgba(212,160,23,0.3)",
            }}
          >
            {meta.emoji}
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-6xl font-black leading-tight"
            style={{
              background:
                "linear-gradient(135deg, #D4A017 0%, #F5A623 50%, #E8712A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {meta.headline}
          </h1>

          {/* Sub */}
          <p className="text-lg text-white/65 max-w-xl leading-relaxed">
            {meta.sub}
          </p>

          {/* CTA */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <WhatsAppCTA
              campaignSlug={slug}
              message={campaign.whatsappMessage}
              label="Aprovechá la promo"
            />
            <p className="text-white/35 text-xs">
              Respuesta inmediata por WhatsApp
            </p>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-2xl p-8"
            style={{
              background: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(212,160,23,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            {[
              { icon: "🏆", label: "Calidad Artesanal" },
              { icon: "⚡", label: "Respuesta Inmediata" },
              { icon: "❤️", label: "100% Sin Conservantes" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2 text-center">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-sm font-semibold text-white/70">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 text-center">
        <p className="text-white/40 text-sm mb-4">
          ¿Tenés preguntas? Escribinos directamente
        </p>
        <WhatsAppCTA
          campaignSlug={slug}
          message={campaign.whatsappMessage}
          label="Hablar con nosotros"
        />
      </section>
    </div>
  );
}
