import { z } from "zod";
import { route, readJson, fromDb, requireAdmin, ApiError } from "@/lib/server/api";
import { productInput } from "@/lib/server/schemas";
import { PRODUCT_SELECT, toProduct } from "@/lib/server/mappers";
import { resolveTaxonomy, rowFromInput } from "@/lib/server/product-write";

const idOf = async (ctx: { params: Promise<Record<string, string>> }) => {
  const id = (await ctx.params).id;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  return id;
};

export const PATCH = route(async (req, ctx) => {
  const { supabase } = await requireAdmin();
  const id = await idOf(ctx);
  const b = productInput.parse(await readJson(req));
  const { brandId, categoryId } = await resolveTaxonomy(supabase, b.brandSlug, b.categorySlug);
  const { data, error } = await supabase.from("products").update({ ...rowFromInput(b, brandId, categoryId), ...(b.slug ? { slug: b.slug } : {}) })
    .eq("id", id).select(PRODUCT_SELECT).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  return { data: toProduct(data) };
});

/** Deleting a product keeps past orders intact: order_items store their own name/SKU/price snapshot. */
export const DELETE = route(async (_req, ctx) => {
  const { supabase } = await requireAdmin();
  const id = await idOf(ctx);
  const { data: before } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("id");
  if (error) throw fromDb(error);
  if (!data?.length) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  const own = ((before?.images ?? []) as string[]).filter((p) => !/^https?:\/\//.test(p));
  if (own.length) await supabase.storage.from("product-images").remove(own);   // best-effort cleanup
  return { ok: true };
});
