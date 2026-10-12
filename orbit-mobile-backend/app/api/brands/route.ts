import { route, fromDb } from "@/lib/server/api";
import { createClient } from "@/lib/supabase/server";

export const GET = route(async () => {
  const { data, error } = await (await createClient()).from("brands").select("slug,name").order("name");
  if (error) throw fromDb(error);
  return { data };
});
