import { route, readJson, fromDb, requireAdmin } from "@/lib/server/api";
import { settingsInput } from "@/lib/server/schemas";

export const GET = route(async () => {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("store_settings").select("key,value");
  if (error) throw fromDb(error);
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return { data: { freeShippingThreshold: Number(m.free_shipping_threshold ?? 150000), flatShipping: Number(m.flat_shipping ?? 500) } };
});

export const PATCH = route(async (req) => {
  const { supabase } = await requireAdmin();
  const b = settingsInput.parse(await readJson(req));
  const { error } = await supabase.from("store_settings").upsert([
    { key: "free_shipping_threshold", value: b.freeShippingThreshold }, { key: "flat_shipping", value: b.flatShipping }]);
  if (error) throw fromDb(error);
  return { ok: true };
});
