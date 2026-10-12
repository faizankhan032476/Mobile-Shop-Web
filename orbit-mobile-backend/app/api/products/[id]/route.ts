import { route, fromDb, ApiError } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, toProduct } from "@/lib/server/mappers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = route(async (_req, ctx) => {
  const { id } = await ctx.params;
  const { data, error } = await (await createClient()).from("products").select(PRODUCT_SELECT).eq(UUID.test(id) ? "id" : "slug", id).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError(404, "NOT_FOUND", "Product not found.");   // unpublished products are hidden by RLS
  return { data: toProduct(data) };
});
