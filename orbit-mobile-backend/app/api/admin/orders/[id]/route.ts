import { z } from "zod";
import { route, readJson, fromDb, requireAdmin, ApiError } from "@/lib/server/api";
import { orderStatusInput } from "@/lib/server/schemas";
import { toOrder } from "@/lib/server/mappers";

const idOf = async (ctx: { params: Promise<Record<string, string>> }) => {
  const id = (await ctx.params).id;
  if (!z.uuid().safeParse(id).success) throw new ApiError(404, "NOT_FOUND", "Order not found.");
  return id;
};

export const GET = route(async (_req, ctx) => {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("orders").select("*, order_items(*), history:order_status_history(from_status,to_status,note,created_at)").eq("id", await idOf(ctx)).maybeSingle();
  if (error) throw fromDb(error);
  if (!data) throw new ApiError(404, "NOT_FOUND", "Order not found.");
  return { data: { ...toOrder(data), history: data.history } };
});

/** Status changes go through a database function that validates transitions and restocks on cancel. */
export const PATCH = route(async (req, ctx) => {
  const { supabase } = await requireAdmin();
  const b = orderStatusInput.parse(await readJson(req));
  const { data, error } = await supabase.rpc("admin_set_order_status", { p_order_id: await idOf(ctx), p_status: b.status ?? null, p_payment_status: b.paymentStatus ?? null, p_note: b.note ?? null });
  if (error) throw fromDb(error);
  return { data: toOrder(data) };
});
