import { z } from "zod";

const slug = z.string().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes.");
const pkr = z.number().int("Whole rupees only.").positive("Must be above 0.").max(10_000_000);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a #RRGGBB color.");

export const productInput = z.object({
  name: z.string().trim().min(3).max(120),
  slug: slug.optional(),
  sku: z.string().trim().min(2).max(40),
  brandSlug: slug,
  categorySlug: slug,
  description: z.string().trim().min(10, "Write at least 10 characters.").max(4000),
  price: pkr,
  originalPrice: pkr.nullable().optional(),
  stock: z.number().int().min(0).max(100_000),
  colors: z.array(z.object({ name: z.string().trim().min(1).max(40), hex })).min(1).max(12),
  storage: z.array(z.string().trim().min(1).max(20)).min(1).max(8),
  specs: z.record(z.string().min(1).max(60), z.string().min(1).max(200)),
  images: z.array(z.string().max(500)).max(10).default([]),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
  onSale: z.boolean().default(false),
}).refine((p) => p.originalPrice == null || p.originalPrice >= p.price, { path: ["originalPrice"], message: "Original price must be at least the selling price." });
export type ProductInput = z.infer<typeof productInput>;

export const stockInput = z.object({ delta: z.number().int().min(-100_000).max(100_000).refine((n) => n !== 0, "Change can’t be zero.") });

const cartItem = z.object({ productId: z.uuid(), color: z.string().min(1).max(40), storage: z.string().min(1).max(20), quantity: z.number().int().min(1).max(10) });
export const quoteInput = z.object({ items: z.array(cartItem).min(1).max(20), discountCode: z.string().trim().max(32).optional() });

export const orderInput = quoteInput.extend({
  idempotencyKey: z.string().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/),
  paymentMethod: z.literal("cod"),
  customer: z.object({ name: z.string().trim().min(3, "Enter your full name.").max(100), email: z.email("Enter a valid email address.").max(254), phone: z.string().trim().regex(/^(\+92|0092|92|0)[\s-]?3\d{2}[\s-]?\d{7}$/, "Enter a Pakistani mobile number, like 0300 1234567.") }),
  shipping: z.object({ address: z.string().trim().min(8, "Enter your full street address.").max(300), city: z.string().trim().min(2, "Enter your city.").max(80), postalCode: z.string().trim().regex(/^\d{5}$/, "Postal codes have 5 digits.").optional().or(z.literal("")) }),
});

export const orderStatusInput = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded", "failed"]).optional(),
  note: z.string().max(300).optional(),
}).refine((v) => v.status || v.paymentStatus, "Provide a status or payment status.");

export const profileInput = z.object({ fullName: z.string().trim().max(100), phone: z.string().trim().regex(/^03\d{9}$/, "Use the format 03001234567.").nullable().or(z.literal("")) });
export const settingsInput = z.object({ freeShippingThreshold: z.number().int().min(0).max(10_000_000), flatShipping: z.number().int().min(0).max(100_000) });
