import { NextResponse } from "next/server";
import { route, readJson, fromDb, getSessionUser, requireUser } from "@/lib/server/api";
import { profileInput } from "@/lib/server/schemas";

export const GET = route(async () => {
  const { supabase, user } = await getSessionUser();
  if (!user) return NextResponse.json({ data: null });
  const { data, error } = await supabase.from("profiles").select("full_name,phone,role").eq("id", user.id).single();
  if (error) throw fromDb(error);
  return { data: { id: user.id, email: user.email ?? "", fullName: data.full_name, phone: data.phone, role: data.role } };
});

export const PATCH = route(async (req) => {
  const { supabase, user } = await requireUser();
  const b = profileInput.parse(await readJson(req));
  // Only these two columns are writable by customers (column-level grant); role cannot be set from here.
  const { error } = await supabase.from("profiles").update({ full_name: b.fullName, phone: b.phone || null }).eq("id", user.id);
  if (error) throw fromDb(error);
  return { ok: true };
});
