import { NextResponse } from "next/server";
import { route, readJson, fromDb, requireAdmin } from "@/lib/server/api";
import { productInput } from "@/lib/server/schemas";
import { PRODUCT_SELECT, toProduct } from "@/lib/server/mappers";
import { resolveTaxonomy, rowFromInput, slugify } from "@/lib/server/product-write";

export const POST = route(async (req) => {
  const { supabase } = await requireAdmin();
  const b = productInput.parse(await readJson(req));
  const { brandId, categoryId } = await resolveTaxonomy(supabase, b.brandSlug, b.categorySlug);
  const { data, error } = await supabase.from("products")
    .insert({ ...rowFromInput(b, brandId, categoryId), slug: b.slug ?? slugify(b.name) }).select(PRODUCT_SELECT).single();
  if (error) throw fromDb(error);
  return NextResponse.json({ data: toProduct(data) }, { status: 201 });
});
export const dynamic = "force-dynamic";
