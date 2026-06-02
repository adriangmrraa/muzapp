# Exploration: Media Upload System

## Current State
- Products have `imageUrl` field in DB but admin UI is a text input (paste URL)
- Menu images are hardcoded: `menu-pizzas.jpeg` (exists) and `menu-pan.jpeg` (doesn't exist)
- No upload API exists (only GET handler for serving files)
- Agent tools exist to send images but depend on static URLs

## Affected Areas
- `src/app/api/media/` — needs POST endpoint for upload
- `src/app/(admin)/admin/products/products-table.tsx` — needs file picker + preview
- `src/app/(admin)/admin/products/actions.ts` — needs to handle file uploads
- `src/app/(admin)/admin/agent/agent-config-form.tsx` — needs menu image uploaders
- `src/lib/whatsapp/tools/sticker-tools.ts` — needs dynamic URLs from DB
- `src/lib/whatsapp/tools/product-tools.ts` — needs imageUrl in SELECTs
- `src/lib/whatsapp/prompt-builder.ts` — needs photo behavior rules

## Approaches
1. **Simple upload API** — POST /api/upload, saves to public/uploads/, returns URL. Integrate into existing product/agent forms.
2. **Direct S3/Cloudinary** — Better for scaling but overkill for Formosa rotisería
3. **Base64 in DB** — Don't. Images in DB is a bad practice.

## Recommendation
**Approach 1**: Simple local upload API. Works with Render's ephemeral storage (uploads survive deploys if in public/).

## Ready for Proposal
Yes
