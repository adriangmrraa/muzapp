import { buildWhatsAppURL } from "@/lib/whatsapp";
import { WHATSAPP_MESSAGES, BREAD_PRODUCTS } from "@/lib/constants";

export default function PanMayoristaPage() {
  const whatsappUrl = buildWhatsAppURL(WHATSAPP_MESSAGES.mayorista);

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

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest mt-4"
          >
            Consultá Precios y Disponibilidad
          </a>
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
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-center text-xs font-semibold uppercase tracking-wider py-2.5 px-4 rounded-full transition-all duration-200 hover:scale-105"
                    style={{
                      background: "rgba(212,160,23,0.1)",
                      border: "1px solid rgba(212,160,23,0.35)",
                      color: "#D4A017",
                    }}
                  >
                    Consultar Precio
                  </a>
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
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
