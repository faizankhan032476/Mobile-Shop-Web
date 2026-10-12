import { z } from "zod";
import { route, fromDb, requireAdmin } from "@/lib/server/api";
import { safeTerm, toOrder } from "@/lib/server/mappers";

const query = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(), q: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const GET = route(async (req) => {
  const { supabase } = await requireAdmin();
  const f = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  let q = supabase.from("orders").select("*, order_items(*)", { count: "exact" });
  if (f.status) q = q.eq("status", f.status);
  const term = f.q ? safeTerm(f.q) : "";
  if (term) q = q.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`);
  const from = (f.page - 1) * f.pageSize;
  const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, from + f.pageSize - 1);
  if (error) throw fromDb(error);
  return { data: (data ?? []).map(toOrder), page: f.page, pageSize: f.pageSize, total: count ?? 0 };
});
