import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

// Load DATABASE_URL from the main checkout's .env (not committed anywhere here)
const envText = readFileSync("C:/Users/Asus/Documents/estabilizacion/Mrs Muzzarella/muzapp/.env", "utf8");
const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; })
);
const url = env.DATABASE_URL || env.DATABASE_URL_UNPOOLED;
if (!url) { console.error("no DATABASE_URL in .env"); process.exit(1); }
console.log("DB host:", new URL(url).host);

const sql = neon(url);

async function main() {

// Mirror of src/lib/catalog-images.ts resolveCatalogImageUrl
function resolve(imageUrl?: string | null): { ok: boolean; resolved: string | null; reason?: string } {
  const value = imageUrl?.trim();
  if (!value) return { ok: false, resolved: null, reason: "empty" };
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value);
      return u.username || u.password ? { ok: false, resolved: null, reason: "url-with-credentials" } : { ok: true, resolved: u.href };
    } catch { return { ok: false, resolved: null, reason: "invalid-url" }; }
  }
  if (value.startsWith("//") || value.includes("\\")) return { ok: false, resolved: null, reason: "scheme/backslash" };
  const withoutPublic = value.replace(/^\.?\/?public\//i, "");
  if (withoutPublic.startsWith("uploads/") || withoutPublic.startsWith("assets/")) return { ok: true, resolved: `/${withoutPublic}` };
  if (value.startsWith("/public/")) return { ok: true, resolved: value.slice(7) };
  if (value.startsWith("/")) return { ok: true, resolved: value };
  return { ok: false, resolved: null, reason: "unresolvable" };
}

const products = await sql`SELECT id, name, image_url, available, coming_soon, stock, is_promo, promo_price, price, category FROM products ORDER BY sort_order`;
const promos = await sql`SELECT id, name, image_url, active, custom_price, items FROM promotions ORDER BY created_at`;

console.log(`\n=== PRODUCTS (${products.length}) ===`);
for (const p of products) {
  const r = resolve(p.image_url);
  console.log(`${r.ok ? "OK " : "BAD"} | id=${p.id} | avail=${p.available} soon=${p.coming_soon} stock=${p.stock} promo=${p.is_promo}/${p.promo_price} | ${p.category} | ${p.name} | img=${p.image_url ?? "NULL"}${r.ok ? "" : ` | REASON: ${r.reason}`}`);
}
console.log(`\n=== PROMOS (${promos.length}) ===`);
for (const p of promos) {
  const r = resolve(p.image_url);
  const items = Array.isArray(p.items) ? p.items.length : 0;
  console.log(`${r.ok ? "OK " : "BAD"} | id=${p.id} | active=${p.active} | items=${items} | price=${p.custom_price} | ${p.name} | img=${p.image_url ?? "NULL"}${r.ok ? "" : ` | REASON: ${r.reason}`}`);
}

// HEAD-check every resolvable URL to see if it actually serves an image
console.log("\n=== URL HEAD CHECK ===");
const seen = new Map<string, Promise<string>>();
const check = async (u: string) => {
  if (!seen.has(u)) seen.set(u, (async () => {
    try {
      const res = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(8000) });
      return `${res.status} ${res.headers.get("content-type") ?? "?"}`;
    } catch (e) { return `FETCH-FAIL ${e instanceof Error ? e.message.slice(0, 60) : "?"}`; }
  })());
  return seen.get(u)!;
};
for (const row of [...products, ...promos]) {
  const r = resolve(row.image_url);
  if (r.ok && r.resolved!.startsWith("http")) {
    console.log(`${await check(r.resolved!)} | ${row.name} | ${r.resolved}`);
  }
}

}
main().catch((e) => { console.error(e); process.exit(1); });
