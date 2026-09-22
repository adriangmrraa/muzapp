# Casos de evaluación anonimizados — Auditoría WhatsApp 2026-09-22

Complemento del informe principal `auditoria-whatsapp-readonly-2026-09-22.md`.
Casos construidos con **patrones y frecuencias reales**, sin PII: sin teléfonos, nombres,
direcciones, textos literales ni IDs reversibles. Referencias como `CONV-###` son
alias del informe, no IDs de base.

---

## E1 — Saludo que tarda en ser pedido (esperado)

- **Patrón:** primer mensaje saludo (44% de n=373) → pregunta de precio (5%) → pedido verbal que nunca llega a `orders`.
- **Frecuencia:** el flujo dominante de la ventana.
- **Evalúa:** conversión conversación→pedido registrado.
- **Aceptación:** el caso pasa si el pedido queda en `orders` con `order_type` y vínculo a la conversación; falla si queda solo en texto.

## E2 — Audio con el pedido adentro (esperado)

- **Patrón:** cliente envía audio (3,6% de mensajes user; 368 en ventana) con detalle del pedido; `transcription` queda vacío.
- **Frecuencia:** ~6 audios/día promedio.
- **Evalúa:** pipeline de transcripción a `content_attributes.transcription`.
- **Aceptación:** pasa si el audio nuevo deja transcripción consultable en minutos; falla si sigue vacío a las 24h.

## E3 — Retoma a los 3 días en el mismo hilo (esperado)

- **Patrón:** cliente vuelve tras >24h de silencio al mismo hilo (175/383, 45,7%).
- **Frecuencia:** casi la mitad de las conversaciones activas.
- **Evalúa:** continuidad de contexto (el hilo conserva productos, precios y acuerdos previos).
- **Aceptación:** pasa si la atención retoma con el contexto visible; falla si se pide todo de nuevo o se abre hilo duplicado.

## R1 — Mega-conversación sin pedido (riesgo)

- **Patrón:** hilo de 1000+ mensajes (top real: 1217/1077/797) sin `orders`, sin lead convertido, sin `order_context_items`.
- **Frecuencia:** 43 conversaciones de 100+ acumulan el 62,7% del tráfico.
- **Evalúa:** detección de hilo improductivo y escalamiento a humano con resumen.
- **Aceptación:** pasa si el sistema alerta (hilo largo sin avance comercial) y propone cierre o resumen; falla si el hilo sigue consumiendo atención sin propuesta.

## R2 — Pico de ~957 mensajes en un día (riesgo)

- **Patrón:** 05/09 concentra ~957 mensajes (~2,6× el promedio de 360/día) con p90 de latencia que se dispara.
- **Frecuencia:** evento atípico dentro de 60 días sin días vacíos.
- **Evalúa:** comportamiento bajo carga (cola, priorización, degradación elegante).
- **Aceptación:** pasa si la cola se ordena por antigüedad y ningún hilo crítico queda >24h sin respuesta; falla si el pico deja colas silenciosas sin registro.

## R3 — B2B disfrazado de B2C (riesgo)

- **Patrón:** cliente pide "docenas" con lenguaje minorista; la keyword lo marcaría B2C pero compra como B2B (pan mayorista, histórico 82/158).
- **Frecuencia:** zona gris entre el 27% B2C y el 14% B2B por keywords, con 90% de leads sin `type`.
- **Evalúa:** tipificación más allá de keywords (producto + cantidad + recurrencia).
- **Aceptación:** pasa si la clasificación usa señales compuestas y admite revisión humana; falla si una keyword decide sola.

## A1 — Echo vacío que no es respuesta (atípico/ruido)

- **Patrón:** mensaje `human` vacío generado por echo de Business (1651 casos, 14,5% de lo `human`).
- **Frecuencia:** ~27/día promedio.
- **Evalúa:** filtrado de ruido en métricas y tableros.
- **Aceptación:** pasa si el echo vacío no cuenta como "respuesta" ni resetea la cola; falla si infla tiempos o cierra pendientes.

## A2 — Ubicación de solo-coordenadas (atípico/fricción)

- **Patrón:** cliente comparte ubicación; queda guardada solo como lat/long sin dirección (96% de 136).
- **Frecuencia:** ~2/día promedio.
- **Evalúa:** normalización a dirección confirmada (`addresses.address` + `label`).
- **Aceptación:** pasa si el flujo propone dirección y el humano confirma antes del reparto; falla si el delivery sale con solo el pin.

---

*Uso sugerido: cada caso es una prueba de aceptación para futuros cambios (seller asistido, transcripción, tableros). Si un cambio no pasa su caso, no sale a producción.*
