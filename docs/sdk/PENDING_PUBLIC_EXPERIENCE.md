# Estado y próximos pasos de la experiencia pública

Fecha de corte: 1 de octubre de 2026.

Este documento audita el cambio local preparado para las pantallas públicas, la carta digital y el flujo carta → admin → WhatsApp → agente. Describe el estado observado en el código y las validaciones ejecutadas. No presupone que el cambio esté desplegado ni probado contra producción.

## Implementado en este cambio

### Carta digital y catálogo

- La carta fue simplificada hacia una composición editorial: fondo cálido oscuro, jerarquía tipográfica, navegación de categorías fija, búsqueda, grilla adaptable, detalle en diálogo, carrito flotante y resumen de pedido.
- Las transiciones usan Framer Motion para encabezados, cambios de categoría, entrada de productos, cantidades, detalle y carrito. `MotionConfig` y `useReducedMotion` respetan la preferencia de movimiento reducido.
- El carrito de la carta conserva líneas en `localStorage`, limita cantidades y evita agregar productos sin precio, próximos o sin stock conocido.
- El carrito compartido de las páginas públicas también usa el nuevo formulario de checkout, de modo que el alta del pedido no depende solamente de la carta digital.
- `CatalogImage` concentra los estados de carga, éxito y error, mantiene el marco estable y muestra un fallback legible cuando la URL no carga.
- `resolveCatalogImageUrl` sanea URLs provenientes de base de datos y admite rutas locales de `public`, `uploads` y `assets`. Las imágenes configuradas en base tienen prioridad; los mapas locales quedan como respaldo cuando corresponde.
- Hamburguesas, detalle de producto, tragos V.I.P. y parte de pan mayorista usan los componentes visuales nuevos y las imágenes resueltas desde catálogo.
- La navegación pública expone con más claridad la carta y el carrito.

### Registro de pedidos y admin

- `POST /api/checkout` valida origen, tipo y tamaño de contenido, aplica rate limit, valida el payload con Zod y recalcula precios y disponibilidad desde la base. No acepta precios enviados por el navegador.
- El checkout valida productos activos, promociones activas, stock agregado y el bloqueo global de hamburguesas.
- El pedido se inserta en `orders` con estado `pending`, etiqueta `Carta digital`, teléfono normalizado y líneas valorizadas desde la base.
- Un UUID generado en el navegador funciona como clave de idempotencia. El servidor usa una etiqueta interna, fingerprint del payload y un advisory lock de PostgreSQL para impedir que reintentos simultáneos creen dos pedidos.
- El admin incluye pedidos de carta y WhatsApp, oculta las etiquetas técnicas y refresca la vista cada 15 segundos y al volver a la pestaña.

### Vínculo seguro con WhatsApp y el agente

- Después de persistir, el servidor devuelve una URL `wa.me` con el resumen y una referencia opaca `WEB:<uuid>` prellenada.
- El agente extrae la referencia únicamente del mensaje recibido por el canal de WhatsApp.
- La referencia sola no concede acceso: `findReferencedWebOrder` exige que el teléfono del remitente normalizado coincida con el teléfono guardado en el pedido.
- Al verificar ambas condiciones, el pedido recibe la etiqueta visible `WhatsApp verificado`; el prompt indica continuar sobre ese pedido y la herramienta `createOrder` queda bloqueada para ese recorrido.
- Aunque el mensaje no conserve la referencia, `createOrder` busca pedidos activos del mismo teléfono y considera cualquier pedido de `Carta digital` para evitar duplicarlo fuera de la ventana normal de 15 minutos.
- `createOrder` dejó de confiar en el teléfono propuesto por el modelo: toma el número real de la conversación. Si no puede verificar pedidos existentes, falla cerrado y no crea uno nuevo.

## Pendiente priorizado

### P0 — necesario antes de considerar terminado el flujo de venta

1. **Probar el recorrido con infraestructura real.** Ejecutar carta → `POST /api/checkout` → fila visible en admin → apertura de WhatsApp → envío real → webhook → `WhatsApp verificado` → respuesta del agente. Incluir un reintento del mismo request, dos requests concurrentes y un mensaje desde un número diferente.
2. **Definir el momento comercial del alta.** Hoy el pedido queda en admin al pulsar “Confirmar y abrir WhatsApp”, antes de que la persona toque “Enviar” en WhatsApp. Una URL `wa.me` no informa si el mensaje fue enviado. Si el requisito exacto es cargarlo recién al enviar, hace falta persistir primero un intento de checkout y convertirlo a pedido cuando el webhook reciba la referencia. Si se conserva el alta temprana, el admin debe diferenciar claramente `Pendiente de WhatsApp` de `WhatsApp verificado` y prever limpieza/cancelación de abandonados.
3. **Agregar pruebas de integración del servicio.** Las pruebas actuales cubren normalización, extracción de referencia, precio confiable, promociones/stock y líneas repetidas. Falta cubrir transacción/idempotencia, fingerprint incompatible, coincidencia de teléfono, marcado `WhatsApp verificado`, fallo de base y bloqueo de `createOrder` con pedido web.
4. **Verificar configuración de producción.** Confirmar `DATABASE_URL`, número destino de WhatsApp y Upstash. El checkout acepta el origen público reconstruido por `X-Forwarded-Host`/`X-Forwarded-Proto` de Render y guarda su referencia `WEB:<uuid>` en `orders.notes`, una columna compatible con el esquema inicial. Sin Upstash el límite es memoria local por instancia y no protege de forma uniforme un despliegue distribuido.

### P1 — completar el alcance visual solicitado

1. **Unificar todas las pantallas públicas.** La portada y las páginas de promociones por slug conservan gran parte del lenguaje anterior (gradientes, glassmorphism, emojis y animaciones más genéricas). Pan mayorista también mezcla el sistema anterior con las nuevas tarjetas. Rehacer esas vistas con el mismo sistema editorial de carta y Tragos V.I.P.
2. **Revisar todos los estados públicos.** Diseñar carga, vacío, error, sin precio, sin stock y próximamente para hamburguesas, pan, tragos, promociones y detalles. Pan mayorista todavía no muestra un error recuperable de carga.
3. **Auditar las imágenes reales de la base.** Generar un reporte de URLs inválidas, duplicadas, inaccesibles, con proporción extrema o resolución insuficiente; corregir datos en admin y validar `uploads`/CDN en producción. El fallback evita romper la interfaz, pero no corrige el catálogo.
4. **Prueba visual responsive y accesible.** Revisar 320/375/768/1024/1440 px, teclado, lector de pantalla, contraste, safe areas, scroll de diálogos y movimiento reducido. En esta sesión no se completó una inspección visual en navegador del entorno local.
5. **Pulir animación y rendimiento.** Medir LCP/CLS/INP con imágenes reales y equipos móviles; ajustar `sizes`, prioridad del hero y densidad de animaciones según resultados. Evitar que la complejidad visual afecte compra o accesibilidad.

### P2 — operación y trazabilidad

1. Vincular el pedido web a `leadId` cuando ya existe un lead del mismo teléfono, o hacerlo al verificarse por WhatsApp, para que historial, cliente y pedido queden relacionados.
2. Añadir al admin filtros o estados de contacto para `Carta digital`, `Pendiente de WhatsApp` y `WhatsApp verificado`, además de una acción clara para abandonar/cancelar intentos nunca enviados.
3. Definir observabilidad del checkout: tasa de confirmación, apertura de WhatsApp, verificación por webhook, errores de catálogo, idempotencia y tiempo hasta primera respuesta. No registrar la referencia completa ni datos personales en logs analíticos.
4. Revisar enlaces directos de WhatsApp que queden fuera del carrito, como consultas mayoristas y FAB, y decidir cuáles son consultas y cuáles deben crear un pedido trazable.

## Riesgos y límites conocidos

- El vínculo `WEB:<uuid>` es seguro para el objetivo actual porque se valida contra el número real del transporte. Debe conservarse opaco, impredecible y sin datos de cliente o precio en la referencia.
- La navegación a WhatsApp ocurre después de una llamada asíncrona y en la misma pestaña. Si la navegación falla, la confirmación deja un enlace para reintentar con el mismo pedido.
- La identificación depende de que la persona use el mismo número declarado en la carta. El flujo actual rechaza la referencia si escribe desde otro teléfono y no crea un duplicado.
- El pedido se guarda sin `leadId`; la asociación funcional existe por teléfono y referencia, pero la relación de datos con el lead todavía no queda materializada.
- La consulta inicial de catálogo del checkout carga productos y promociones completos. Es correcta funcionalmente para el volumen actual, pero conviene seleccionar únicamente las filas requeridas si el catálogo crece.
- La validación de origen acepta el dominio interno de Next, los dominios configurados y el origen público reconstruido por el proxy de Render. Debe probarse una vez en el deployment real junto con el checkout completo.
- Las etiquetas internas se ocultan en la tarjeta del admin, pero siguen almacenadas en `orders.tags`; cualquier otra exportación o vista debe aplicar el mismo criterio.

## Validaciones ejecutadas en este corte

| Verificación | Resultado |
| --- | --- |
| `npm run typecheck` | Pasa |
| `npm run build` | Pasa; Next 16.2.4 compiló y generó 39 páginas/rutas, incluida `/api/checkout` |
| `git diff --check` | Pasa |
| `node --import tsx --test src/lib/checkout/*.test.ts` | 7/7 pruebas pasan, incluidas las cabeceras de proxy de Render |
| ESLint dirigido de carta, API checkout, contrato/servicio, imágenes, productos, storefront y Tragos V.I.P. | Pasa después de corregir la restauración de `localStorage` |
| ESLint ampliado incluyendo `whatsapp/agent.ts` | Conserva cinco `no-explicit-any` y warnings preexistentes en ese archivo; es deuda separada del nuevo checkout visual |
| Recorrido real con base, admin y webhook | No ejecutado |
| Inspección visual en navegador local | No completada |

## Secuencia recomendada para el siguiente cambio

1. Crear pruebas de integración del checkout y del reconocimiento por referencia/teléfono.
2. Ejecutar el recorrido real en un entorno de prueba con base y webhook, incluyendo duplicados y teléfonos incorrectos.
3. Resolver si el admin representa intentos previos al envío o únicamente pedidos verificados; implementar el estado o tabla necesaria.
4. Completar portada, promociones y pan mayorista con el sistema visual editorial.
5. Auditar las URLs de imágenes de la base y corregir datos.
6. Hacer una pasada responsive, accesible y de rendimiento antes del despliegue.
7. Resolver la deuda de lint preexistente del agente en un cambio separado, con pruebas de regresión del flujo conversacional.
