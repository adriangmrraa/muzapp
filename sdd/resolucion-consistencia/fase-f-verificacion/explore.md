# Explore Fase F: Verificación Final de Entry Points

## Objetivo

Barrer todo el código base para asegurar que NO HAY ningún entry point donde un teléfono pueda persistirse sin pasar por `normalizePhone()`.

## Contexto Actual

Después de las fases A-E, todos los entry points CONOCIDOS estarán cubiertos. Pero pueden haber:
- Entry points que no detectamos en el análisis inicial
- Nuevos entry points agregados en el futuro
- Caminos indirectos (ej: un webhook que llama a una función que a su vez crea un lead)

## Fuentes de Riesgo a Verificar

### Entry points conocidos (a verificar que TODOS tengan normalizePhone):

1. ✅ Telegram `toolsOrder.ts` — createOrder, createDeliveredOrder
2. ❓ Telegram `toolsClient.ts` — createClient, updateClient, getClientByPhone
3. ❓ Telegram `toolsManagement.ts` — searchClient, getClientDetail, getCustomerFullProfile, injectCustomerNote
4. ❓ Telegram `toolsOrder.ts` — getClientHistory, suggestProducts, setClientAlias
5. ❓ WhatsApp `lead-capture.ts` — captureLeadIfNew
6. ❓ API `POST /api/leads` — creación de leads
7. ❓ Admin UI `actions.ts` — updateClient, deleteLead
8. ❓ Frontend `client-edit-form.tsx` — phone input en formulario

### Entry points a verificar con el delegado:

9. ❓ Webhook de WhatsApp (`/api/webhook/whatsapp/route.ts`)
10. ❓ Webhook de Meta (`/api/meta/webhook/route.ts`)
11. ❓ Tools del agente de WhatsApp (`src/lib/whatsapp/tools/`)
12. ❓ Webhook de WhatsApp secundario (`/api/whatsapp/webhook/route.ts`)

## Herramientas de Verificación

- `grep -r "leads.insert" src/` — buscar todas las inserciones a leads
- `grep -r "\.phone" src/` — buscar referencias a phone en general
- `grep -r "eq(leads.phone" src/` — buscar todas las consultas por teléfono

## Criterio de Aceptación

NO debe haber ningún `db.insert(leads).values({ phone: ... })` o `db.update(leads).set({ phone: ... })` que NO haya pasado por `normalizePhone()`.

## Nota

Esta fase es de ASEGURAMIENTO, no de implementación. Puede generar issues para fases adicionales si se encuentran entry points no cubiertos.
