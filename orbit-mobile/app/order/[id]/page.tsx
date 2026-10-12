"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useOrders } from "@/lib/hooks";
import { formatDate, formatPKR } from "@/lib/format";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { orders } = useOrders();
  const o = orders.find((x) => x.id === id);
  if (!o) return <div className="container-x grid place-items-center gap-4 py-24 text-center"><h1 className="text-3xl font-bold">Order not found</h1><p className="text-muted">Demo orders live in this browser only.</p><Link href="/orders" className="btn btn-primary">View my orders</Link></div>;
  return (
    <div className="container-x max-w-2xl py-12">
      <div className="text-center"><CheckCircle2 size={44} className="mx-auto text-ok" /><h1 className="mt-3 text-3xl font-bold">Demo order placed</h1><p className="mt-2 text-muted">Order <b className="text-ink">{o.number}</b> · {formatDate(o.createdAt)}. No payment was taken and nothing will be shipped.</p></div>
      <div className="card mt-8 divide-y divide-line">
        <div className="p-5 text-sm"><h2 className="mb-2 font-bold">Delivering to</h2>{o.customer.name}<br />{o.shipping.address}, {o.shipping.city} {o.shipping.postalCode}<br />{o.customer.phone} · {o.customer.email}<br /><span className="text-muted">Payment: {o.payment} · Status: {o.status}</span></div>
        <ul className="space-y-2 p-5 text-sm">{o.items.map((i) => <li key={i.productId + i.color + i.storage} className="flex justify-between"><span>{i.qty} × {i.name} <span className="text-muted">({i.color}, {i.storage})</span></span><span>{formatPKR(i.qty * i.unitPrice)}</span></li>)}</ul>
        <div className="space-y-1 p-5 text-sm"><R k="Subtotal" v={formatPKR(o.subtotal)} />{o.discount > 0 && <R k="Discount" v={`-${formatPKR(o.discount)}`} />}<R k="Shipping" v={o.shippingCost ? formatPKR(o.shippingCost) : "Free"} /><div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{formatPKR(o.total)}</span></div></div>
      </div>
      <div className="mt-6 flex justify-center gap-3"><Link href="/orders" className="btn btn-outline">My orders</Link><Link href="/shop" className="btn btn-primary">Keep shopping</Link></div>
    </div>
  );
}
const R = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
