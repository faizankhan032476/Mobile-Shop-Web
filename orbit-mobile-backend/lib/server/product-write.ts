import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api";
import type { ProductInput } from "./schemas";

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

export async function resolveTaxonomy(supabase: SupabaseClient, brandSlug: string, categorySlug: string) {
  const [b, c] = await Promise.all([
    supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle(),
    supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle(),
  ]);
  if (!b.data) throw new ApiError(400, "VALIDATION", "Unknown brand.", { brandSlug: "Choose an existing brand." });
  if (!c.data) throw new ApiError(400, "VALIDATION", "Unknown category.", { categorySlug: "Choose an existing category." });
  return { brandId: b.data.id as string, categoryId: c.data.id as string };
}

export const rowFromInput = (b: ProductInput, brandId: string, categoryId: string) => ({
  name: b.name, sku: b.sku, brand_id: brandId, category_id: categoryId, description: b.description, price: b.price,
  compare_at_price: b.originalPrice ?? null, stock: b.stock, colors: b.colors, storage_options: b.storage, specs: b.specs,
  images: b.images, is_published: b.published, is_featured: b.featured, is_on_sale: b.onSale || (b.originalPrice != null && b.originalPrice > b.price),
});
