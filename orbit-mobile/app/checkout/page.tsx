"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart, useOrders, useProducts } from "@/lib/hooks";
import { COUPONS, priceLines, totals } from "@/lib/pricing";
import { formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Order, PaymentMethod } from "@/types";

const PAYMENTS: { v: PaymentMethod; note: string }[] = [
  { v: "Cash on Delivery", note: "Pay the courier when your phone arrives." },
  { v: "Bank Transfer (demo)", note: "Demo option. No bank details are shown and nothing is transferred." },
  { v: "Card (demo, not processed)", note: "Demo option. Do not enter card details; no payment is taken." },
];
type Form = { name: string; email: string; phone: string; address: string; city: string; postal: string };
const EMPTY: Form = { name: "", email: "", phone: "", address: "", city: "", postal: "" };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 3) e.name = "Enter your full name (at least 3 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = "Enter a valid email, like name@example.com.";
  if (!/^(\+92|0092|92|0)3\d{9}$/.test(f.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a Pakistani mobile number, like 0300 1234567.";
  if (f.address.trim().length < 8) e.address = "Enter your full street address.";
  if (f.city.trim().length < 2) e.city = "Enter your city.";
  if (f.postal && !/^\d{5}$/.test(f.postal)) e.postal = "Postal codes in Pakistan have 5 digits.";
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { products, save } = useProducts();
  const { add } = useOrders();
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [pay, setPay] = useState<PaymentMethod>("Cash on Delivery");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [busy, setBusy] = useState(false);

  const priced = priceLines(lines, products);
  const t = totals(priced, applied);

  if (priced.length === 0) return (
    <div className="container-x grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Nothing to check out</h1>
      <p className="text-muted">Your cart is empty.</p>
      <Link href="/shop" className="btn btn-primary">Browse phones</Link>
    </div>
  );

  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-semibold">{label}</label>
      <input id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-e` : undefined} className="input" {...props} />
      {errors[k] && <p id={`${k}-e`} className="field-error">{errors[k]}</p>}
    </div>
  );

  const applyCode = () => {
    const c = code.trim().toUpperCase();
    if (COUPONS[c]) { setApplied(c); toast(`Code ${c} applied`); } else { setApplied(""); toast("That code isn’t valid", "error"); }
  };

  const place = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(f);
    setErrors(err);
    if (Object.keys(err).length) { toast("Please fix the highlighted fields", "error"); document.getElementById(Object.keys(err)[0])?.focus(); return; }
    setBusy(true);
    const now = new Date();
    const order: Order = {
      id: `ord-${now.getTime()}`, number: `ORB-${now.getTime().toString().slice(-7)}`, createdAt: now.toISOString(), status: "Pending",
      customer: { name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() },
      shipping: { address: f.address.trim(), city: f.city.trim(), postalCode: f.postal },
      payment: pay, simulated: true, subtotal: t.subtotal, shippingCost: t.shipping, discount: t.discount, total: t.total,
      items: priced.map((l) => ({ productId: l.productId, name: l.product.name, color: l.color, storage: l.storage, qty: l.qty, unitPrice: l.product.price })),
    };
    add(order);
    priced.forEach((l) => save({ ...l.product, stock: Math.max(0, l.product.stock - l.qty), popularity: l.product.popularity + l.qty }));
    clear();
    router.push(`/order/${order.id}`);
  };

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Checkout</h1>
      <form onSubmit={place} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5"><h2 className="text-lg font-bold">Contact</h2>
            {field("name", "Full name", { autoComplete: "name" })}
            <div className="grid gap-4 sm:grid-cols-2">{field("email", "Email", { type: "email", autoComplete: "email" })}{field("phone", "Mobile number", { type: "tel", autoComplete: "tel", placeholder: "0300 1234567" })}</div></section>
          <section className="card space-y-4 p-5"><h2 className="text-lg font-bold">Delivery address</h2>
            {field("address", "Street address", { autoComplete: "street-address" })}
            <div className="grid gap-4 sm:grid-cols-2">{field("city", "City", { autoComplete: "address-level2" })}{field("postal", "Postal code (optional)", { inputMode: "numeric", maxLength: 5 })}</div></section>
          <fieldset className="card space-y-3 p-5"><legend className="px-1 text-lg font-bold">Payment</legend>
            {PAYMENTS.map((p) => (
              <label key={p.v} className={`flex cursor-pointer gap-3 rounded-xl border-[1.5px] p-4 ${pay === p.v ? "border-brand bg-brand/5" : "border-line"}`}>
                <input type="radio" name="pay" checked={pay === p.v} onChange={() => setPay(p.v)} className="mt-1" />
                <span><span className="block font-semibold">{p.v}</span><span className="text-sm text-muted">{p.note}</span></span>
              </label>
            ))}
          </fieldset>
        </div>
        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">{priced.map((l) => <li key={l.productId + l.color + l.storage} className="flex justify-between gap-3"><span>{l.qty} × {l.product.name} <span className="text-muted">({l.storage})</span></span><span>{formatPKR(l.lineTotal)}</span></li>)}</ul>
          <div className="flex gap-2 border-t border-line pt-3"><label className="sr-only" htmlFor="coupon">Discount code</label><input id="coupon" className="input" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} /><button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button></div>
          <Line k="Subtotal" v={formatPKR(t.subtotal)} />
          {t.discount > 0 && <Line k={`Discount (${applied})`} v={`-${formatPKR(t.discount)}`} />}
          <Line k="Shipping" v={t.shipping === 0 ? "Free" : formatPKR(t.shipping)} />
          <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><span>Total</span><span>{formatPKR(t.total)}</span></div>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Placing order…" : "Place demo order"}</button>
          <p className="text-xs text-muted">This is a demo. Your order is saved only in this browser and no payment is taken.</p>
        </aside>
      </form>
    </div>
  );
}
const Line = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between text-sm"><span className="text-muted">{k}</span><span>{v}</span></div>;
