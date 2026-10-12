import { z } from "zod";
import { route, fromDb, ApiError, getSessionUser } from "@/lib/server/api";
import { toOrder } from "@/lib/server/mappers";

/** Owner (via session + RLS) or guest (via secret token header). Order IDs alone never grant access. */
export const GET = route(async (req, ctx) => {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", "Order not found.");
  const { supabase, user } = await getSessionUser();
  if (user) {
    const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
    if (error) throw fromDb(error);
    if (data) return { data: toOrder(data) };
  }
  const token = req.headers.get("x-order-token");
  if (token && z.uuid().safeParse(token).success) {
    const { data, error } = await supabase.rpc("get_guest_order", { p_order_id: id, p_token: token });
    if (error) throw fromDb(error);
    if (data) return { data: toOrder(data) };
  }
  throw new ApiError(404, "NOT_FOUND", "Order not found.");   // same answer whether it exists or not
});
