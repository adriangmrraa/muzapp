# Agentes actuales: correcciones de confiabilidad en main

Esta pasada modifica los agentes existentes de WhatsApp y Telegram. No conecta ni habilita Jev.

## Cambios operativos

- El teléfono del delivery tiene prioridad; vendedor y lista permitida usan la misma normalización. Solo un customer pasa por captura de leads y autorrespuesta inicial.
- WhatsApp y Telegram recuperan los mensajes **más recientes** en orden cronológico. El buffer reemplaza los mensajes entrantes persistidos por un único turno agrupado, identificado por ID del proveedor cuando existe.
- El vendedor ya no puede llamar `broadcastWhatsApp`. El prompt del vendedor coincide con sus tools disponibles. Los precios de ejemplos y diccionarios fueron eliminados; el menú y las promociones se obtienen de la DB.
- El handler alternativo de Telegram usa el prompt dinámico. El prompt administrativo ya no sugiere precios fijos, costos de delivery estimados ni operaciones ficticias, y la lista de promociones activas sale de la tabla `promotions`.
- Los precios de `addOrderItem` y de la creación de pedidos se resuelven desde DB; cantidades inválidas y productos sin precio válido se rechazan antes de escribir el pedido. Un producto gratis debe configurarse explícitamente en otra ruta, ya que estas tools de venta requieren precio positivo.
- `createOrder` puede crear clientes nuevos sin teléfono, como promete la tool. Una coincidencia aproximada no vincula automáticamente un pedido a otro cliente; un nombre abreviado no sobreescribe el nombre almacenado. `createDeliveredOrder` también acepta teléfono opcional.
- Se retiró la tool `confirmOrder` del cliente: marcaba el carrito como consumido sin haber insertado el pedido. `createOrder` sigue siendo el único paso que crea y luego limpia el carrito.
- El cron es el único emisor de follow-ups. Usa horario argentino y un reclamo atómico por pedido antes de llamar al proveedor, sin migraciones de base de datos.

## Verificación

`npm run typecheck`, `npm run test:agents`, `npm run build -- --webpack`. El lint general mantiene deuda previa; comprobar también el lint focalizado sobre módulos nuevos o modificados.

## Riesgos pendientes

- El reclamo de follow-up favorece **a lo sumo un envío**: si el proceso cae o el proveedor da un resultado ambiguo después del reclamo, el pedido queda marcado para revisión manual. No se reintenta automáticamente porque podría duplicar mensajes. Revisar logs `[followup]` y conciliar antes de reponer `followupSent=false`.
- Los pedidos hechos por Telegram/WhatsApp necesitan pruebas reales contra DB de prueba y proveedor antes de asumir cobertura de extremo a extremo. Estas pruebas locales validan reglas puras y permisos; no envían mensajes reales.
- `broadcastWhatsApp` permanece disponible para el administrador Telegram. La confirmación de operaciones destructivas o masivas aún depende del prompt; falta una compuerta de confirmación determinista antes de considerarlas seguras ante instrucciones adversariales.
- El lint global y otros posibles flujos heredados fuera de estos agentes siguen pendientes de saneamiento separado.
