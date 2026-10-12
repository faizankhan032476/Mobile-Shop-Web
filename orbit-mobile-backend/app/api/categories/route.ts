import { route, fromDb } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";

export const GET = route(async () => {
  const { data, error } = await (await createClient()).from("categories").select("slug,name,blurb").order("sort_order");
  if (error) throw fromDb(error);
  return { data };
});
