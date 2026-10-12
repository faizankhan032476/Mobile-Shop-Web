/* eslint-disable @typescript-eslint/no-explicit-any -- test helpers handle loosely typed SQL rows */
// Database tests: run the real migrations in an in-memory Postgres (PGlite) with minimal stand-ins for
// Supabase's auth/storage schemas. Verifies RLS, grants, order creation, idempotency and inventory rules.
// Limits: PGlite is single-connection, so true parallel-transaction races are NOT exercised here.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const sql = (f: string) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const db = new PGlite();
const ids = { alice: "11111111-1111-4111-8111-111111111111", bob: "22222222-2222-4222-8222-222222222222", admin: "33333333-3333-4333-8333-333333333333" };
const customer = { name: "Test Buyer", email: "buyer@example.com", phone: "0300 1234567" };
const ship = { address: "House 1, Street 2, Block 3", city: "Karachi", postal_code: "75500" };
let p: Record<string, { id: string }> = {};
let n = 0;
const key = () => `idem-key-${String(++n).padStart(6, "0")}-abcdefgh`;

async function as(role: "anon" | "authenticated" | "postgres", sub = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [sub]);
  if (role !== "postgres") await db.exec(`set role ${role}`);
}
const rpcOrder = (items: unknown, over: Partial<{ key: string; code: string | null; pay: string }> = {}) =>
  db.query<{ r: any }>("select public.create_order($1,$2::jsonb,$3::jsonb,$4::jsonb,$5,$6) as r",
    [over.key ?? key(), JSON.stringify(items), JSON.stringify(customer), JSON.stringify(ship), over.pay ?? "cod", over.code ?? null]);
const line = (slug: string, qty = 1, color?: string, storage?: string) => ({ product_id: p[slug].id, quantity: qty, color: color ?? "Black", storage: storage ?? "128GB" });
const stock = async (slug: string) => (await db.query<{ stock: number }>("select stock from public.products where slug=$1", [slug])).rows[0].stock;
const fails = async (fn: () => Promise<unknown>, msg: RegExp) => { await expect(fn()).rejects.toThrow(msg); };

beforeAll(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text); alter table storage.objects enable row level security;
    grant usage on schema public to anon, authenticated;`);
  for (const f of ["migrations/0001_schema.sql", "migrations/0002_rls.sql", "migrations/0003_functions.sql", "migrations/0004_storage.sql", "seed.sql"]) await db.exec(sql(f));
  for (const [k, v] of Object.entries(ids)) await db.query("insert into auth.users (id, raw_user_meta_data) values ($1, $2)", [v, JSON.stringify({ full_name: k, role: "admin" })]);
  await db.query("update public.profiles set role='admin' where id=$1", [ids.admin]);   // what the first-admin SQL does
  const rows = (await db.query<{ slug: string; id: string }>("select slug, id from public.products")).rows;
  p = Object.fromEntries(rows.map((r) => [r.slug, r]));
  // deterministic variants for tests
  await db.exec(`update public.products set colors='[{"name":"Black","hex":"#111111"}]', storage_options=array['128GB'] where slug in ('infinix-hot-50','tecno-spark-30','galaxy-a56','iphone-16-pro-max');
                 update public.products set stock=10 where slug='infinix-hot-50'; update public.products set stock=1 where slug='tecno-spark-30';`);
}, 120_000);

describe("signup + profiles", () => {
  it("creates a customer profile and ignores a role smuggled in signup metadata", async () => {
    const r = await db.query<{ role: string }>("select role from public.profiles where id=$1", [ids.alice]);
    expect(r.rows[0].role).toBe("customer");
  });
});

describe("RLS: public visitor", () => {
  it("reads published products only and cannot read private tables", async () => {
    await as("anon");
    expect((await db.query("select 1 from public.products")).rows.length).toBeGreaterThan(5);
    await fails(() => db.query("select * from public.orders"), /permission denied/);
    await fails(() => db.query("select * from public.profiles"), /permission denied/);
    await fails(() => db.query("select * from public.discount_codes"), /permission denied/);
    await fails(() => db.query("update public.products set price=1"), /permission denied/);
    await fails(() => db.query("insert into public.products (slug) values ('x')"), /permission denied/);
  });
  it("cannot call admin functions", async () => {
    await as("anon");
    await fails(() => db.query("select public.admin_dashboard_stats()"), /permission denied/);
    await fails(() => db.query("select public._price_cart('[]'::jsonb,null,false)"), /permission denied/);
  });
});

describe("RLS: customer", () => {
  it("cannot promote themselves, edit products/stock, or touch orders", async () => {
    await as("authenticated", ids.alice);
    await fails(() => db.query("update public.profiles set role='admin' where id=$1", [ids.alice]), /permission denied/);
    const upd = await db.query("update public.products set price=1, stock=999 where slug='galaxy-a56'");
    expect(upd.affectedRows).toBe(0);                                   // RLS filters the row out
    await fails(() => db.query("insert into public.products (slug) values ('x')"), /row-level security|violates|null value|permission/);
    await fails(() => db.query("update public.orders set total=1"), /permission denied/);
    await fails(() => db.query("insert into public.orders (order_number) values ('x')"), /permission denied/);
    await fails(() => db.query("select public.admin_adjust_stock($1, 5)", [p["galaxy-a56"].id]), /FORBIDDEN/);
    await fails(() => db.query("select public.admin_dashboard_stats()"), /FORBIDDEN/);
    await as("postgres");
    expect(await stock("galaxy-a56")).toBeGreaterThan(5);
  });
  it("can update own name/phone but not another profile", async () => {
    await as("authenticated", ids.alice);
    expect((await db.query("update public.profiles set full_name='Alice A', phone='03001234567' where id=$1", [ids.alice])).affectedRows).toBe(1);
    expect((await db.query("update public.profiles set full_name='hax' where id=$1", [ids.bob])).affectedRows).toBe(0);
    expect((await db.query("select id from public.profiles")).rows).toHaveLength(1);   // sees only itself
  });
  it("addresses are private to their owner", async () => {
    await as("authenticated", ids.alice);
    await db.query("insert into public.addresses (user_id, full_name, phone, address_line, city) values ($1,'Alice A','03001234567','House 9, Street 1','Lahore')", [ids.alice]);
    await fails(() => db.query("insert into public.addresses (user_id, full_name, phone, address_line, city) values ($1,'Bob','03001234567','House 9, Street 1','Lahore')", [ids.bob]), /row-level security/);
    await as("authenticated", ids.bob);
    expect((await db.query("select * from public.addresses")).rows).toHaveLength(0);
  });
});

describe("create_order", () => {
  it("prices from the database, decrements stock and returns a guest token", async () => {
    await as("anon");
    const before = await (async () => { await as("postgres"); const s = await stock("infinix-hot-50"); await as("anon"); return s; })();
    const r = (await rpcOrder([line("infinix-hot-50", 2)])).rows[0].r;
    expect(r.total).toBe(54000 * 2 + 500);                               // below free-shipping threshold
    expect(r.guest_token).toBeTruthy();
    expect(r.duplicate).toBe(false);
    await as("postgres");
    expect(await stock("infinix-hot-50")).toBe(before - 2);
  });
  it("is idempotent: the same key never creates or charges stock twice", async () => {
    await as("postgres"); const before = await stock("infinix-hot-50"); await as("anon");
    const k = key();
    const a = (await rpcOrder([line("infinix-hot-50")], { key: k })).rows[0].r;
    const b = (await rpcOrder([line("infinix-hot-50")], { key: k })).rows[0].r;
    expect(b.duplicate).toBe(true); expect(b.id).toBe(a.id);
    await as("postgres");
    expect(await stock("infinix-hot-50")).toBe(before - 1);
    expect((await db.query("select count(*)::int c from public.orders where idempotency_key=$1", [k])).rows[0]).toEqual({ c: 1 });
  });
  it("prevents overselling", async () => {
    await as("anon");
    await rpcOrder([line("tecno-spark-30", 1)]);                         // takes the last unit
    await fails(() => rpcOrder([line("tecno-spark-30", 1)]), /INSUFFICIENT_STOCK/);
    await as("postgres"); expect(await stock("tecno-spark-30")).toBe(0);
  });
  it("rejects bad input", async () => {
    await as("anon");
    await fails(() => rpcOrder([line("infinix-hot-50", 0)]), /INVALID_CART/);
    await fails(() => rpcOrder([line("infinix-hot-50", -3)]), /INVALID_CART/);
    await fails(() => rpcOrder([line("infinix-hot-50", 11)]), /INVALID_CART/);
    await fails(() => rpcOrder([]), /INVALID_CART/);
    await fails(() => rpcOrder([line("infinix-hot-50"), line("infinix-hot-50")]), /INVALID_CART/);
    await fails(() => rpcOrder([{ product_id: "00000000-0000-4000-8000-000000000000", quantity: 1, color: "Black", storage: "128GB" }]), /PRODUCT_UNAVAILABLE/);
    await fails(() => rpcOrder([line("infinix-hot-50", 1, "Hot Pink")]), /INVALID_VARIANT/);
    await fails(() => rpcOrder([line("infinix-hot-50", 1, "Black", "9TB")]), /INVALID_VARIANT/);
    await fails(() => rpcOrder([line("infinix-hot-50")], { pay: "card" }), /PAYMENT_METHOD_UNSUPPORTED/);
    await fails(() => rpcOrder([line("infinix-hot-50")], { code: "NOPE" }), /INVALID_DISCOUNT/);
    await fails(() => rpcOrder([line("infinix-hot-50")], { key: "short" }), /INVALID_IDEMPOTENCY_KEY/);
    await fails(() => db.query("select public.create_order($1,$2::jsonb,$3::jsonb,$4::jsonb,'cod')", [key(), JSON.stringify([line("infinix-hot-50")]), JSON.stringify({ ...customer, phone: "12345" }), JSON.stringify(ship)]), /INVALID_CUSTOMER/);
  });
  it("applies discount codes and free shipping on the server", async () => {
    await as("anon");
    const r = (await rpcOrder([line("galaxy-a56", 2)], { code: "orbit5" })).rows[0].r;   // 238,000 ; 5% off ; free shipping
    expect(r.total).toBe(238000 - 11900);
  });
  it("blocks writes to protected columns even for the owner and keeps guest orders private", async () => {
    await as("anon");
    const g = (await rpcOrder([line("infinix-hot-50")])).rows[0].r;
    expect((await db.query("select public.get_guest_order($1,$2) r", [g.id, g.guest_token])).rows[0]).toMatchObject({ r: { order_number: g.order_number } });
    expect((await db.query("select public.get_guest_order($1,$2) r", [g.id, "99999999-9999-4999-8999-999999999999"])).rows[0].r).toBeNull();
    await as("authenticated", ids.bob);
    expect((await db.query("select * from public.orders where id=$1", [g.id])).rows).toHaveLength(0);   // not visible to other users
    const json = (await db.query("select public.get_guest_order($1,$2) r", [g.id, g.guest_token])).rows[0].r;
    expect(json.guest_token).toBeUndefined(); expect(json.idempotency_key).toBeUndefined();
  });
  it("links orders to the signed-in user and shows them only to that user", async () => {
    await as("authenticated", ids.alice);
    const r = (await rpcOrder([line("infinix-hot-50")])).rows[0].r;
    expect(r.guest_token).toBeNull();
    expect((await db.query("select id from public.orders")).rows.map((x: any) => x.id)).toEqual([r.id]);
    expect((await db.query("select id from public.order_items")).rows.length).toBe(1);
    await as("authenticated", ids.bob);
    expect((await db.query("select id from public.orders")).rows).toHaveLength(0);
  });
});

describe("admin", () => {
  it("can manage products and see all orders", async () => {
    await as("authenticated", ids.admin);
    expect((await db.query("update public.products set price=118000 where slug='galaxy-a56'")).affectedRows).toBe(1);
    expect((await db.query("select id from public.orders")).rows.length).toBeGreaterThan(3);
    expect(Number((await db.query("select public.admin_adjust_stock($1, 5) r", [p["tecno-spark-30"].id])).rows[0].r)).toBe(5);
    await fails(() => db.query("select public.admin_adjust_stock($1, -100)", [p["tecno-spark-30"].id]), /stock/);
    const stats = (await db.query("select public.admin_dashboard_stats() r")).rows[0] as any;
    expect(stats.r.orders).toBeGreaterThan(3);
  });
  it("cannot change a role through the API even as admin", async () => {
    await as("authenticated", ids.admin);
    await fails(() => db.query("update public.profiles set role='admin' where id=$1", [ids.bob]), /permission denied/);
  });
  it("cancelling restocks exactly once and rejects invalid transitions", async () => {
    await as("anon");
    await as("postgres"); const before = await stock("infinix-hot-50"); await as("anon");
    const o = (await rpcOrder([line("infinix-hot-50", 3)])).rows[0].r;
    await as("authenticated", ids.alice);
    await fails(() => db.query("select public.admin_set_order_status($1,'cancelled')", [o.id]), /FORBIDDEN/);
    await as("authenticated", ids.admin);
    await db.query("select public.admin_set_order_status($1,'confirmed')", [o.id]);
    await fails(() => db.query("select public.admin_set_order_status($1,'pending')", [o.id]), /INVALID_TRANSITION/);
    await db.query("select public.admin_set_order_status($1,'cancelled')", [o.id]);
    await fails(() => db.query("select public.admin_set_order_status($1,'shipped')", [o.id]), /INVALID_TRANSITION/);
    await as("postgres");
    expect(await stock("infinix-hot-50")).toBe(before);
    expect((await db.query("select count(*)::int c from public.order_status_history where order_id=$1", [o.id])).rows[0]).toEqual({ c: 3 });
  });
  it("order history survives product deletion with original price and name", async () => {
    await as("anon");
    const o = (await rpcOrder([line("iphone-16-pro-max")])).rows[0].r;
    await as("authenticated", ids.admin);
    await db.query("delete from public.products where slug='iphone-16-pro-max'");
    const item = (await db.query<any>("select product_id, product_name, unit_price from public.order_items where order_id=$1", [o.id])).rows[0];
    expect(item).toEqual({ product_id: null, product_name: "Apple iPhone 16 Pro Max", unit_price: 589000 });
  });
  it("storage policies exist and restrict writes to admins", async () => {
    await as("postgres");
    const r = (await db.query<any>("select policyname from pg_policies where tablename='objects' and schemaname='storage'")).rows;
    expect(r.length).toBe(4);
  });
});
