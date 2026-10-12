import { z } from "zod";
import { route, fromDb } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_SELECT, safeTerm, toProduct } from "@/lib/server/mappers";

const query = z.object({
  q: z.string().max(80).optional(), category: z.string().max(60).optional(), brand: z.string().max(60).optional(),
  sale: z.enum(["1"]).optional(), inStock: z.enum(["1"]).optional(), featured: z.enum(["1"]).optional(), includeUnpublished: z.enum(["1"]).optional(),
  minPrice: z.coerce.number().int().min(0).optional(), maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["popular", "newest", "price-asc", "price-desc", "rating"]).default("popular"),
  page: z.coerce.number().int().min(1).max(10_000).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(24),
});
const SORTS = { popular: ["popularity", false], newest: ["created_at", false], "price-asc": ["price", true], "price-desc": ["price", false], rating: ["rating", false] } as const;
const NONE = "00000000-0000-0000-0000-000000000000";

export const GET = route(async (req) => {
  const f = query.parse(Object.fromEntries(new URL(req.url).searchParams));
  const supabase = await createClient();
  let q = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });

  // Unpublished products are visible to admins only (RLS enforces this regardless).
  let showAll = false;
  if (f.includeUnpublished) showAll = Boolean((await supabase.rpc("is_admin")).data);
  if (!showAll) q = q.eq("is_published", true);

  if (f.category) { const { data } = await supabase.from("categories").select("id").eq("slug", f.category).maybeSingle(); q = q.eq("category_id", data?.id ?? NONE); }
  if (f.brand) { const { data } = await supabase.from("brands").select("id").eq("slug", f.brand).maybeSingle(); q = q.eq("brand_id", data?.id ?? NONE); }
  const term = f.q ? safeTerm(f.q) : "";
  if (term) {
    const { data: bs } = await supabase.from("brands").select("id").ilike("name", `%${term}%`);
    const ids = (bs ?? []).map((b) => b.id);
    q = q.or([`name.ilike.%${term}%`, `sku.ilike.%${term}%`, ...(ids.length ? [`brand_id.in.(${ids.join(",")})`] : [])].join(","));
  }
  if (f.sale) q = q.not("compare_at_price", "is", null);
  if (f.inStock) q = q.gt("stock", 0);
  if (f.featured) q = q.eq("is_featured", true);
  if (f.minPrice !== undefined) q = q.gte("price", f.minPrice);
  if (f.maxPrice !== undefined) q = q.lte("price", f.maxPrice);

  const [col, asc] = SORTS[f.sort];
  const from = (f.page - 1) * f.pageSize;
  const { data, error, count } = await q.order(col, { ascending: asc }).order("id").range(from, from + f.pageSize - 1);
  if (error) throw fromDb(error);
  return { data: (data ?? []).map(toProduct), page: f.page, pageSize: f.pageSize, total: count ?? 0 };
});
