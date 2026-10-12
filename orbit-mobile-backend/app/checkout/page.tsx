"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCart, useMe, useProducts } from "@/lib/hooks";
import { priceLines } from "@/lib/pricing";
import { useQuote } from "@/lib/use-quote";
import { api, ApiClientError } from "@/lib/api-client";
import { saveGuestToken } from "@/lib/guest-orders";
import { formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";

type Form = { name: string; email: string; phone: string; address: string; city: string; postal: string };
const EMPTY: Form = { name: "", email: "", phone: "", address: "", city: "", postal: "" };
// Mirrors the server rules for instant feedback only. The server and database validate again.
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
const newKey = () => `chk_${crypto.randomUUID().replace(/-/g, "")}`;

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { products, status } = useProducts();
  const { me } = useMe();
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const idem = useRef<string>("");        // one key per checkout attempt: a double-click can never create two orders

  const priced = priceLines(lines, products);
  const { quote: t, error: quoteError } = useQuote(priced, applied);

  if (status === "idle" || status === "loading") return <div className="container-x py-24 text-center text-muted" aria-live="polite">Loading checkout…</div>;
  if (priced.length === 0) return (
    <div className="container-x grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Nothing to check out</h1><p className="text-muted">Your cart is empty.</p>
      <Link href="/shop" className="btn btn-primary">Browse phones</Link>
    </div>
  );

  const val = (k: keyof Form) => f[k] || (k === "name" ? me?.fullName ?? "" : k === "email" ? me?.email ?? "" : k === "phone" ? me?.phone ?? "" : "");
  const field = (k: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-semibold">{label}</label>
      <input id={k} value={val(k)} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-e` : undefined} className="input" {...props} />
      {errors[k] && <p id={`${k}-e`} className="field-error">{errors[k]}</p>}
    </div>
  );

  const applyCode = async () => {
    const c = code.trim().toUpperCase();
    if (!c) { setApplied(""); return; }
    try {
      await api("/api/quote", { method: "POST", json: { items: priced.map((l) => ({ productId: l.productId, color: l.color, storage: l.storage, quantity: l.qty })), discountCode: c } });
      setApplied(c); toast(`Code ${c} applied`);
    } catch (e) { setApplied(""); toast(e instanceof ApiClientError ? e.message : "Couldn’t apply that code", "error"); }
  };

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    const merged: Form = { ...f, name: val("name"), email: val("email"), phone: val("phone") };
    const err = validate(merged);
    setErrors(err); setFormError("");
    if (Object.keys(err).length) { toast("Please fix the highlighted fields", "error"); document.getElementById(Object.keys(err)[0])?.focus(); return; }
    setBusy(true);
    idem.current ||= newKey();
    try {
      const r = await api<{ data: { id: string; guestToken: string | null } }>("/api/orders", { method: "POST", json: {
        idempotencyKey: idem.current, paymentMethod: "cod", discountCode: applied || undefined,
        items: priced.map((l) => ({ productId: l.productId, color: l.color, storage: l.storage, quantity: l.qty })),
        customer: { name: merged.name.trim(), email: merged.email.trim(), phone: merged.phone.trim() },
        shipping: { address: merged.address.trim(), city: merged.city.trim(), postalCode: merged.postal },
      } });
      if (r.data.guestToken) saveGuestToken(r.data.id, r.data.guestToken);
      clear();
      router.push(`/order/${r.data.id}`);
    } catch (ex) {
      setBusy(false);
      if (ex instanceof ApiClientError) {
        if (ex.fields) setErrors({ name: ex.fields["customer.name"], email: ex.fields["customer.email"], phone: ex.fields["customer.phone"], address: ex.fields["shipping.address"], city: ex.fields["shipping.city"], postal: ex.fields["shipping.postalCode"] });
        if (ex.status !== 0 && ex.status !== 500) idem.current = "";        // a definite rejection: allow a fresh attempt
        setFormError(ex.message);
      } else setFormError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Checkout</h1>
      <form onSubmit={place} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {!me && <p className="rounded-lg bg-brand/5 p-3 text-sm">Checking out as a guest. <Link href="/login?next=/checkout" className="font-semibold text-brand underline">Sign in</Link> to keep your orders in your account.</p>}
          <section className="card space-y-4 p-5"><h2 className="text-lg font-bold">Contact</h2>
            {field("name", "Full name", { autoComplete: "name" })}
            <div className="grid gap-4 sm:grid-cols-2">{field("email", "Email", { type: "email", autoComplete: "email" })}{field("phone", "Mobile number", { type: "tel", autoComplete: "tel", placeholder: "0300 1234567" })}</div></section>
          <section className="card space-y-4 p-5"><h2 className="text-lg font-bold">Delivery address</h2>
            {field("address", "Street address", { autoComplete: "street-address" })}
            <div className="grid gap-4 sm:grid-cols-2">{field("city", "City", { autoComplete: "address-level2" })}{field("postal", "Postal code (optional)", { inputMode: "numeric", maxLength: 5 })}</div></section>
          <fieldset className="card space-y-3 p-5"><legend className="px-1 text-lg font-bold">Payment</legend>
            <label className="flex gap-3 rounded-xl border-[1.5px] border-brand bg-brand/5 p-4"><input type="radio" name="pay" checked readOnly className="mt-1" /><span><span className="block font-semibold">Cash on Delivery</span><span className="text-sm text-muted">Pay the courier in cash when your phone arrives.</span></span></label>
            <p className="text-sm text-muted">Online card and bank payments are not available yet.</p>
          </fieldset>
        </div>
        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Order summary</h2>
          <ul className="space-y-2 text-sm">{priced.map((l) => <li key={l.productId + l.color + l.storage} className="flex justify-between gap-3"><span>{l.qty} × {l.product.name} <span className="text-muted">({l.storage})</span></span><span>{formatPKR(l.lineTotal)}</span></li>)}</ul>
          <div className="flex gap-2 border-t border-line pt-3"><label className="sr-only" htmlFor="coupon">Discount code</label><input id="coupon" className="input" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} /><button type="button" className="btn btn-outline" onClick={applyCode}>Apply</button></div>
          {quoteError && <p role="alert" className="text-sm text-sale">{quoteError}</p>}
          <Line k="Subtotal" v={t ? formatPKR(t.subtotal) : "…"} />
          {t && t.discount > 0 && <Line k={`Discount (${t.discountCode})`} v={`-${formatPKR(t.discount)}`} />}
          <Line k="Shipping" v={t ? (t.shipping === 0 ? "Free" : formatPKR(t.shipping)) : "…"} />
          <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><span>Total</span><span>{t ? formatPKR(t.total) : "…"}</span></div>
          {formError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-sale">{formError}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !t}>{busy ? "Placing order…" : "Place order (pay on delivery)"}</button>
        </aside>
      </form>
    </div>
  );
}
const Line = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between text-sm"><span className="text-muted">{k}</span><span>{v}</span></div>;
