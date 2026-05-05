import { BREAD_PRODUCTS } from "@/lib/constants";
import { WhatsAppCTA } from "@/components/attribution/whatsapp-cta";

export default function PanMayoristaPage() {
  const benefits = [
    {
      icon: "🏆",
      title: "Calidad Premium",
      description:
        "Elaboración artesanal con harinas seleccionadas y procesos de fermentación lenta para un sabor y textura sin igual.",
    },
    {
      icon: "📦",
      title: "Precios por Bulto",
      description:
        "Precios competitivos en pedidos mayoristas. Trabajamos con restaurantes, hamburgueserías y cocinas de todo tipo.",
    },
    {
      icon: "🚚",
      title: "Entrega Confiable",
      description:
        "Cumplimos con los plazos acordados. Tu cocina nunca se queda sin pan cuando trabajás con nosotros.",
    },
    {
      icon: "🤝",
      title: "Relación Directa",
      description:
        "Sin intermediarios. Hablás directo con quien hace el pan. Adaptamos formatos y cantidades a tu negocio.",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 20% 30%, rgba(212,160,23,0.08) 0%, transparent 50%), #0a0a0a",
      }}
    >
      {/* Hero */}
      <section className="pt-28 pb-20 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-[0.3em] px-4 py-1.5 rounded-full"
            style={{
              background: "rgba(212,160,23,0.1)",
              border: "1px solid rgba(212,160,23,0.3)",
              color: "#D4A017",
            }}
          >
            Servicio Mayorista
          </span>

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
            Pan Artesanal
            <br />
            para tu Negocio
          </h1>

          <p className="text-lg text-white/65 max-w-2xl leading-relaxed">
            Proveemos pan artesanal de calidad premium para restaurantes, hamburgueserías y cocinas profesionales. Sin conservantes, con fermentación lenta y el sabor que tus clientes van a notar.
          </p>

          <WhatsAppCTA
            campaignSlug="mayorista"
            message="Hola! Me interesa información sobre pan mayorista"
            label="Consultá Precios y Disponibilidad"
            className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest mt-4"
          />
        </div>
      </section>

      {/* Benefits grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-white mb-10">
            Por qué elegirnos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex flex-col gap-3 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,160,23,0.3)",
                }}
              >
                <span className="text-3xl">{benefit.icon}</span>
                <h3
                  className="font-bold text-base"
                  style={{
                    background: "linear-gradient(135deg, #D4A017, #F5A623)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {benefit.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black text-white mb-2">
            Nuestras Variedades
          </h2>
          <p className="text-center text-white/50 text-sm mb-10">
            Todos los precios son por bulto cerrado. Consultá disponibilidad y pedido mínimo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BREAD_PRODUCTS.map((bread) => (
              <div
                key={bread.id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(212,160,23,0.3)",
                }}
              >
                {/* Image placeholder */}
                <div
                  className="w-full h-36 flex items-center justify-center text-5xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(212,160,23,0.12) 0%, rgba(232,113,42,0.07) 100%)",
                  }}
                >
                  <span role="img" aria-label={bread.name}>
                    {bread.emoji}
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-5">
                  <h3
                    className="font-bold text-base"
                    style={{
                      background: "linear-gradient(135deg, #D4A017, #F5A623)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {bread.name}
                  </h3>
                  <p className="text-xs text-white/55 leading-relaxed">
                    {bread.description}
                  </p>
                  <WhatsAppCTA
                    campaignSlug="mayorista"
                    message="Hola! Me interesa información sobre pan mayorista"
                    label="Consultar Precio"
                    className="mt-3 text-center text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-full transition-all duration-200 hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-10 flex flex-col items-center gap-5"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(212,160,23,0.3)",
            }}
          >
            <span className="text-4xl">🤝</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ¿Listo para trabajar juntos?
            </h2>
            <p className="text-white/60 leading-relaxed max-w-lg">
              Escribinos por WhatsApp y te respondemos en el día. Armamos una propuesta adaptada a tu volumen y necesidades.
            </p>
            <WhatsAppCTA
              campaignSlug="mayorista"
              message="Hola! Me interesa información sobre pan mayorista"
              label="Escribinos por WhatsApp"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
