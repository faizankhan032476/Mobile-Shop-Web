import { z } from "zod";
import { route, readJson, fromDb, requireAdmin, ApiError } from "@/lib/server/api";
import { stockInput } from "@/lib/server/schemas";

/** Atomic relative stock change (e.g. +20 restock, -2 damaged). Never goes below zero. */
export const POST = route(async (req, ctx) => {
  const { supabase } = await requireAdmin();
  const id = (await ctx.params).id;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", "Product not found.");
  const { delta } = stockInput.parse(await readJson(req));
  const { data, error } = await supabase.rpc("admin_adjust_stock", { p_product_id: id, p_delta: delta });
  if (error) throw fromDb(error.code === "23514" ? { ...error, message: "INVALID_DELTA", details: "stock can’t go below 0" } : error);
  return { data: { stock: data } };
});
