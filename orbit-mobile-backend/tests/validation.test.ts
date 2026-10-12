import { describe, expect, it } from "vitest";
import { orderInput, productInput, stockInput, quoteInput } from "@/lib/server/schemas";
import { safeNext } from "@/lib/server/redirects";

const uuid = "5b3f7c0e-6a3b-4d6e-9d6a-0c1c2f4b7a10";
const order = {
  idempotencyKey: "chk_0123456789abcdef0123", paymentMethod: "cod" as const,
  items: [{ productId: uuid, color: "Black", storage: "128GB", quantity: 1 }],
  customer: { name: "Test Buyer", email: "a@b.pk", phone: "0300 1234567" },
  shipping: { address: "House 1, Street 2", city: "Lahore", postalCode: "54000" },
};

describe("order validation", () => {
  it("accepts a valid COD order", () => expect(orderInput.safeParse(order).success).toBe(true));
  it("rejects client-supplied totals/prices (they are not part of the schema and are stripped)", () => {
    const r = orderInput.parse({ ...order, total: 1, items: [{ ...order.items[0], unitPrice: 1 }] }) as Record<string, unknown>;
    expect(r.total).toBeUndefined();
    expect((r.items as Record<string, unknown>[])[0].unitPrice).toBeUndefined();
  });
  it.each([
    ["negative quantity", { items: [{ ...order.items[0], quantity: -1 }] }],
    ["zero quantity", { items: [{ ...order.items[0], quantity: 0 }] }],
    ["fractional quantity", { items: [{ ...order.items[0], quantity: 1.5 }] }],
    ["quantity over limit", { items: [{ ...order.items[0], quantity: 11 }] }],
    ["non-uuid product id", { items: [{ ...order.items[0], productId: "iphone" }] }],
    ["empty cart", { items: [] }],
    ["online payment method", { paymentMethod: "card" }],
    ["short idempotency key", { idempotencyKey: "abc" }],
    ["bad phone", { customer: { ...order.customer, phone: "12345" } }],
    ["bad email", { customer: { ...order.customer, email: "nope" } }],
    ["bad postal code", { shipping: { ...order.shipping, postalCode: "12" } }],
  ])("rejects %s", (_n, patch) => expect(orderInput.safeParse({ ...order, ...patch }).success).toBe(false));
  it("limits cart size", () => expect(quoteInput.safeParse({ items: Array(21).fill(order.items[0]) }).success).toBe(false));
});

describe("product validation", () => {
  const p = { name: "Phone X", sku: "SKU-1", brandSlug: "apple", categorySlug: "flagship", description: "A fine test phone.", price: 1000, stock: 3,
    colors: [{ name: "Black", hex: "#000000" }], storage: ["128GB"], specs: { Display: "6in" } };
  it("accepts a valid product", () => expect(productInput.safeParse(p).success).toBe(true));
  it.each([
    ["negative price", { price: -5 }], ["zero price", { price: 0 }], ["fractional price", { price: 10.5 }], ["negative stock", { stock: -1 }],
    ["comparison price below price", { originalPrice: 500 }], ["bad color hex", { colors: [{ name: "x", hex: "red" }] }], ["no storage", { storage: [] }], ["too many images", { images: Array(11).fill("a") }],
  ])("rejects %s", (_n, patch) => expect(productInput.safeParse({ ...p, ...patch }).success).toBe(false));
  it("stock changes must be non-zero integers", () => {
    expect(stockInput.safeParse({ delta: 0 }).success).toBe(false);
    expect(stockInput.safeParse({ delta: 1.5 }).success).toBe(false);
    expect(stockInput.safeParse({ delta: -4 }).success).toBe(true);
  });
});

describe("redirect safety", () => {
  it.each([["/shop"], ["/order/abc?x=1"]])("allows %s", (n) => expect(safeNext(n)).toBe(n));
  it.each([["//evil.com"], ["https://evil.com"], ["/\\evil.com"], ["javascript:alert(1)"], [undefined], [""]])("blocks %s", (n) => expect(safeNext(n)).toBe("/account"));
});
