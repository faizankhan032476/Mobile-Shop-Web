"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useGuestTokens } from "@/lib/guest-orders";
import { formatDate, formatPKR } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { Order } from "@/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const tokens = useGuestTokens();
  const token = tokens[id];
  const [o, setO] = useState<Order | null>(null);
  const [state, setState] = useState<"loading" | "missing">("loading");

  useEffect(() => {
    let live = true;
    api<{ data: Order }>(`/api/orders/${id}`, { headers: token ? { "x-order-token": token } : {} })
      .then((r) => live && setO(r.data)).catch(() => live && setState("missing"));
    return () => { live = false; };
  }, [id, token]);

  if (!o) return state === "loading"
    ? <div className="container-x py-24 text-center text-muted" aria-live="polite">Loading your order…</div>
    : <div className="container-x grid place-items-center gap-4 py-24 text-center"><h1 className="text-3xl font-bold">Order not found</h1><p className="max-w-md text-muted">Orders are private. Sign in to the account you ordered with, or open this page in the browser you used at checkout.</p><Link href="/orders" className="btn btn-primary">View my orders</Link></div>;
  return (
    <div className="container-x max-w-2xl py-12">
      <div className="text-center"><CheckCircle2 size={44} className="mx-auto text-ok" /><h1 className="mt-3 text-3xl font-bold">Order placed</h1><p className="mt-2 text-muted">Order <b className="text-ink">{o.number}</b> · {formatDate(o.createdAt)}. Pay in cash when it arrives.</p></div>
      <div className="card mt-8 divide-y divide-line">
        <div className="p-5 text-sm"><h2 className="mb-2 font-bold">Delivering to</h2>{o.customer.name}<br />{o.shipping.address}, {o.shipping.city} {o.shipping.postalCode}<br />{o.customer.phone} · {o.customer.email}<br /><span className="text-muted">Cash on Delivery · {STATUS_LABEL[o.status]} · Payment: {PAYMENT_LABEL[o.paymentStatus]}</span></div>
        <ul className="space-y-2 p-5 text-sm">{o.items.map((i) => <li key={i.sku + i.color + i.storage} className="flex justify-between"><span>{i.qty} × {i.name} <span className="text-muted">({i.color}, {i.storage})</span></span><span>{formatPKR(i.qty * i.unitPrice)}</span></li>)}</ul>
        <div className="space-y-1 p-5 text-sm"><R k="Subtotal" v={formatPKR(o.subtotal)} />{o.discount > 0 && <R k={`Discount (${o.discountCode})`} v={`-${formatPKR(o.discount)}`} />}<R k="Shipping" v={o.shippingCost ? formatPKR(o.shippingCost) : "Free"} /><div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{formatPKR(o.total)}</span></div></div>
      </div>
      <div className="mt-6 flex justify-center gap-3"><Link href="/orders" className="btn btn-outline">My orders</Link><Link href="/shop" className="btn btn-primary">Keep shopping</Link></div>
    </div>
  );
}
const R = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
