import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}

/** Database function error codes -> HTTP responses. Anything unknown becomes a generic 500 (details are never leaked). */
const DB_ERRORS: Record<string, [number, string]> = {
  INVALID_CART: [400, "Your cart contains an invalid item or quantity."],
  PRODUCT_UNAVAILABLE: [409, "A product in your cart is no longer available."],
  INVALID_VARIANT: [409, "The selected color or storage is not available for this product."],
  INSUFFICIENT_STOCK: [409, "There isn’t enough stock for this product."],
  INVALID_DISCOUNT: [400, "That discount code isn’t valid for this order."],
  INVALID_CUSTOMER: [400, "Please check your contact details."],
  INVALID_SHIPPING: [400, "Please check your delivery address."],
  INVALID_IDEMPOTENCY_KEY: [400, "Invalid request key."],
  PAYMENT_METHOD_UNSUPPORTED: [400, "That payment method isn’t available. Choose Cash on Delivery."],
  FORBIDDEN: [403, "You don’t have permission to do that."],
  ORDER_NOT_FOUND: [404, "Order not found."],
  PRODUCT_NOT_FOUND: [404, "Product not found."],
  INVALID_TRANSITION: [409, "That status change isn’t allowed."],
  INVALID_DELTA: [400, "Enter a stock change between -100000 and 100000, not zero."],
};

export function fromDb(error: { message: string; details?: string | null; code?: string }): ApiError {
  const hit = DB_ERRORS[error.message];
  if (hit) return new ApiError(hit[0], error.message, error.details ? `${hit[1]} (${error.details})` : hit[1]);
  if (error.code === "23505") return new ApiError(409, "DUPLICATE", "That value is already in use (slug or SKU must be unique).");
  if (error.code === "23503") return new ApiError(409, "IN_USE", "This record is still referenced by other data.");
  if (error.code === "23514") return new ApiError(400, "CONSTRAINT", "A value is outside the allowed range.");
  if (error.code === "42501") return new ApiError(403, "FORBIDDEN", "You don’t have permission to do that.");
  console.error("[db error]", error.code, error.message);          // message only; never secrets
  return new ApiError(500, "SERVER_ERROR", "Something went wrong. Please try again.");
}

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 100_000) throw new ApiError(413, "TOO_LARGE", "Request body is too large.");
  try { return await req.json(); } catch { throw new ApiError(400, "BAD_JSON", "Request body must be valid JSON."); }
}

type Ctx = { params: Promise<Record<string, string>> };
export function route(fn: (req: Request, ctx: Ctx) => Promise<Response | object>) {
  return async (req: Request, ctx: Ctx) => {
    try {
      if (!isSupabaseConfigured()) throw new ApiError(503, "NOT_CONFIGURED", "The backend isn’t configured yet. See SETUP_GUIDE.md.");
      const out = await fn(req, ctx);
      return out instanceof Response ? out : NextResponse.json(out);
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: { code: e.code, message: e.message, fields: e.fields } }, { status: e.status });
      if (e instanceof ZodError) {
        const fields = Object.fromEntries(e.issues.map((i) => [i.path.join(".") || "_", i.message]));
        return NextResponse.json({ error: { code: "VALIDATION", message: "Please fix the highlighted fields.", fields } }, { status: 400 });
      }
      console.error("[api error]", e instanceof Error ? e.message : "unknown");
      return NextResponse.json({ error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." } }, { status: 500 });
    }
  };
}

export async function getSessionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();      // verifies the token with Supabase Auth on every call
  return { supabase, user: data.user };
}

export async function requireUser() {
  const { supabase, user } = await getSessionUser();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in.");
  return { supabase, user };
}

/** Role is read from the database for the verified user. Nothing from the request can influence it. */
export async function requireAdmin() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (error || data?.role !== "admin") throw new ApiError(403, "FORBIDDEN", "Administrator access required.");
  return { supabase, user };
}
