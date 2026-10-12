// Authorization-layer tests: verify requireAdmin / route wrappers using a mocked Supabase session.
// These prove OUR code denies access; database-level enforcement is covered by supabase/tests/db.test.ts.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const state = { user: null as null | { id: string }, role: "customer" as string | null, rpcCalls: [] as string[] };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => (state.role ? { data: { role: state.role }, error: null } : { data: null, error: { message: "x" } }) }) }) }),
    rpc: async (fn: string) => { state.rpcCalls.push(fn); return { data: null, error: null }; },
  }),
}));
vi.mock("@/lib/supabase/env", () => ({ SUPABASE_URL: "http://x", SUPABASE_PUBLISHABLE_KEY: "k", isSupabaseConfigured: () => true }));

const ctx = { params: Promise.resolve({ id: "5b3f7c0e-6a3b-4d6e-9d6a-0c1c2f4b7a10" }) };
const req = (body: unknown = {}) => new Request("http://t/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

beforeEach(() => { state.user = null; state.role = "customer"; state.rpcCalls = []; });

describe("admin routes deny non-admins", async () => {
  const stock = await import("@/app/api/admin/products/[id]/stock/route");
  const stats = await import("@/app/api/admin/stats/route");
  const orders = await import("@/app/api/admin/orders/[id]/route");
  const products = await import("@/app/api/admin/products/route");

  it("401 when signed out", async () => {
    for (const call of [() => stock.POST(req({ delta: 5 }), ctx), () => stats.GET(req(), ctx), () => orders.PATCH(req({ status: "shipped" }), ctx), () => products.POST(req({}), ctx)]) {
      expect((await call()).status).toBe(401);
    }
    expect(state.rpcCalls).toEqual([]);                          // nothing reached the database layer
  });
  it("403 for a signed-in customer, even if the request claims to be admin", async () => {
    state.user = { id: "u1" };
    const body = { delta: 5, role: "admin", isAdmin: true };
    expect((await stock.POST(req(body), ctx)).status).toBe(403);
    expect((await stats.GET(req(), ctx)).status).toBe(403);
    expect((await orders.PATCH(req({ status: "shipped" }), ctx)).status).toBe(403);
    expect((await products.POST(req({ name: "x" }), ctx)).status).toBe(403);
    expect(state.rpcCalls).toEqual([]);
  });
  it("403 when the profile row can't be read", async () => {
    state.user = { id: "u1" }; state.role = null;
    expect((await stats.GET(req(), ctx)).status).toBe(403);
  });
  it("admins reach validation and the database layer", async () => {
    state.user = { id: "a1" }; state.role = "admin";
    expect((await stock.POST(req({ delta: 0 }), ctx)).status).toBe(400);   // validated before any DB call
    expect(state.rpcCalls).toEqual([]);
    await stock.POST(req({ delta: 5 }), ctx);
    expect(state.rpcCalls).toEqual(["admin_adjust_stock"]);
  });
  it("rejects malformed ids with 404 and malformed JSON with 400", async () => {
    state.user = { id: "a1" }; state.role = "admin";
    expect((await stock.POST(req({ delta: 1 }), { params: Promise.resolve({ id: "not-a-uuid" }) })).status).toBe(404);
    expect((await stock.POST(new Request("http://t", { method: "POST", body: "{nope" }), ctx)).status).toBe(400);
  });
});

describe("customer routes", async () => {
  const myOrders = await import("@/app/api/orders/route");
  it("requires sign-in to list orders", async () => { expect((await myOrders.GET(req(), ctx)).status).toBe(401); });
  it("creating an order validates input before touching the database", async () => {
    const r = await myOrders.POST(req({ items: [{ productId: "x", quantity: -1 }] }), ctx);
    expect(r.status).toBe(400);
    expect((await r.json()).error.code).toBe("VALIDATION");
    expect(state.rpcCalls).toEqual([]);
  });
});
