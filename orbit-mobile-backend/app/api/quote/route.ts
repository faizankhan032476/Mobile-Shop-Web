import { route, readJson, fromDb } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";
import { quoteInput } from "@/lib/server/schemas";

/** Authoritative price preview. Totals always come from the database, never from the browser. */
export const POST = route(async (req) => {
  const b = quoteInput.parse(await readJson(req));
  const { data, error } = await (await createClient()).rpc("quote_order", {
    p_items: b.items.map((i) => ({ product_id: i.productId, color: i.color, storage: i.storage, quantity: i.quantity })),
    p_discount_code: b.discountCode || null,
  });
  if (error) throw fromDb(error);
  return { data: { subtotal: data.subtotal, discount: data.discount, shipping: data.shipping, total: data.total, discountCode: data.discount_code ?? null } };
});
