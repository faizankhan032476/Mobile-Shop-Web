// Regenerates supabase/seed.sql from data/products.ts. Run: node --experimental-strip-types scripts/generate-seed.mts
import { writeFileSync } from "node:fs";
import { SEED_PRODUCTS, BRANDS, CATEGORIES } from "../data/products.ts";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const out: string[] = [
  "-- seed.sql : DEMO DATA ONLY. Every product/discount row below is flagged is_demo = true.",
  "-- Safe to re-run: uses ON CONFLICT DO NOTHING. Run AFTER the four migrations.",
  "",
  "insert into public.categories (slug, name, blurb, sort_order) values",
  CATEGORIES.map((c, i) => `  (${q(slug(c.name))}, ${q(c.name)}, ${q(c.blurb)}, ${i})`).join(",\n") + "\non conflict (slug) do nothing;",
  "",
  "insert into public.brands (slug, name) values",
  BRANDS.map((b) => `  (${q(slug(b))}, ${q(b)})`).join(",\n") + "\non conflict (slug) do nothing;",
  "",
  "insert into public.store_settings (key, value) values",
  "  ('free_shipping_threshold', '150000'::jsonb), ('flat_shipping', '500'::jsonb), ('store_name', '\"Orbit Mobile (demo)\"'::jsonb)",
  "on conflict (key) do nothing;",
  "",
  "insert into public.discount_codes (code, percent_off, is_demo) values ('ORBIT5', 5, true), ('WELCOME2', 2, true) on conflict (code) do nothing;",
  "",
];
for (const p of SEED_PRODUCTS) {
  const sku = ("ORB-" + p.id).toUpperCase().slice(0, 40);
  out.push(
    `insert into public.products (slug, sku, name, brand_id, category_id, description, price, compare_at_price, colors, storage_options, specs, images, stock, is_published, is_featured, is_on_sale, is_demo, popularity, rating, review_count, created_at)`,
    `select ${q(p.id)}, ${q(sku)}, ${q(p.name)}, b.id, c.id, ${q("[Demo product] " + p.description)}, ${p.price}, ${p.originalPrice ?? "null"},`,
    `  $j$${JSON.stringify(p.colors)}$j$::jsonb, array[${p.storage.map(q).join(", ")}], $j$${JSON.stringify(p.specs)}$j$::jsonb, '{}', ${p.stock}, true, ${p.featured}, ${p.onSale}, true, ${p.popularity}, ${p.rating}, ${p.reviewCount}, ${q(p.createdAt)}`,
    `from public.brands b, public.categories c where b.slug = ${q(slug(p.brand))} and c.slug = ${q(slug(p.category))}`,
    `on conflict (slug) do nothing;`, "",
  );
}
writeFileSync("supabase/seed.sql", out.join("\n"));
console.log("wrote supabase/seed.sql with", SEED_PRODUCTS.length, "products");
