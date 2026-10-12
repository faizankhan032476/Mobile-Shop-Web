import { NextResponse } from "next/server";
import { route, readJson, fromDb, requireUser } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";
import { orderInput } from "@/lib/server/schemas";
import { toOrder } from "@/lib/server/mappers";

/** Create an order. Works for guests and signed-in customers. Safe to retry with the same idempotencyKey. */
export const POST = route(async (req) => {
  const b = orderInput.parse(await readJson(req));
  const { data, error } = await (await createClient()).rpc("create_order", {
    p_idempotency_key: b.idempotencyKey,
    p_items: b.items.map((i) => ({ product_id: i.productId, color: i.color, storage: i.storage, quantity: i.quantity })),
    p_customer: b.customer,
    p_shipping: { address: b.shipping.address, city: b.shipping.city, postal_code: b.shipping.postalCode || null },
    p_payment_method: b.paymentMethod,
    p_discount_code: b.discountCode || null,
  });
  if (error) throw fromDb(error);
  return NextResponse.json({ data: { id: data.id, orderNumber: data.order_number, guestToken: data.guest_token, total: data.total, duplicate: data.duplicate } }, { status: data.duplicate ? 200 : 201 });
});

/** The signed-in customer's own orders. */
export const GET = route(async () => {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw fromDb(error);
  return { data: (data ?? []).map(toOrder) };
});
