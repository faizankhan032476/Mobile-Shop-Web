import { route, fromDb, requireAdmin } from "@/lib/server/api";

export const GET = route(async () => {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw fromDb(error);
  return { data };
});
