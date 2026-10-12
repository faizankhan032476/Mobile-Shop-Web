"use client";
import { useState } from "react";
import { useOrders, useProducts } from "@/lib/hooks";
import { formatDate, formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Order, OrderStatus } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrders() {
  const { orders, setStatus } = useOrders();
  const { products, save } = useProducts();
  const [q, setQ] = useState("");
  const [status, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancel, setCancel] = useState<Order | null>(null);
  const list = orders.filter((o) => (!status || o.status === status) && `${o.number} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(q.toLowerCase()));
  const sel = orders.find((o) => o.id === openId);

  const doCancel = (o: Order) => {
    setStatus(o.id, "Cancelled");
    o.items.forEach((i) => { const p = products.find((x) => x.id === i.productId); if (p) save({ ...p, stock: p.stock + i.qty }); }); // return units to stock
    toast(`${o.number} cancelled and stock restored`);
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Orders</h1><p className="text-sm text-muted">Simulated orders only. No real customers or payments.</p></div>
      <div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="ao-q">Search orders</label><input id="ao-q" className="input max-w-xs" placeholder="Search order, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ao-s">Status</label><select id="ao-s" className="input !w-auto" value={status} onChange={(e) => setFilter(e.target.value)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="card overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr><th className="p-3">Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="text-right">Total</th><th className="p-3" /></tr></thead>
        <tbody className="divide-y divide-line">{list.map((o) => <tr key={o.id}><td className="p-3 font-semibold">{o.number}</td><td>{o.customer.name}</td><td>{formatDate(o.createdAt)}</td><td>{o.status}</td><td className="text-right">{formatPKR(o.total)}</td><td className="p-3 text-right"><button className="btn btn-outline !min-h-9" onClick={() => setOpenId(o.id)}>Details</button></td></tr>)}</tbody></table>
        {list.length === 0 && <p className="p-8 text-center text-sm text-muted">No orders match.</p>}</div>

      {sel && (
        <div role="dialog" aria-modal="true" aria-label={`Order ${sel.number}`} className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-4" onClick={() => setOpenId(null)}>
          <div className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between"><h2 className="text-xl font-bold">{sel.number}</h2><button className="text-sm font-semibold text-muted" onClick={() => setOpenId(null)}>Close</button></div>
            <p className="text-sm">{sel.customer.name}<br />{sel.customer.email} · {sel.customer.phone}<br />{sel.shipping.address}, {sel.shipping.city} {sel.shipping.postalCode}<br /><span className="text-muted">{sel.payment}</span></p>
            <ul className="divide-y divide-line text-sm">{sel.items.map((i) => <li key={i.productId + i.color + i.storage} className="flex justify-between py-2"><span>{i.qty} × {i.name} <span className="text-muted">({i.color}, {i.storage})</span></span><span>{formatPKR(i.qty * i.unitPrice)}</span></li>)}</ul>
            <p className="flex justify-between font-bold"><span>Total</span><span>{formatPKR(sel.total)}</span></p>
            <div><label htmlFor="os" className="mb-1 block text-sm font-semibold">Status</label>
              <select id="os" className="input" value={sel.status} disabled={sel.status === "Cancelled"} onChange={(e) => { if (e.target.value === "Cancelled") setCancel(sel); else { setStatus(sel.id, e.target.value as OrderStatus); toast(`Status set to ${e.target.value}`); } }}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              {sel.status === "Cancelled" && <p className="mt-1 text-xs text-muted">Cancelled orders can’t be reopened in the demo.</p>}</div>
          </div>
        </div>
      )}
      <ConfirmDialog open={!!cancel} title={`Cancel ${cancel?.number ?? "order"}?`} body="The order is marked cancelled and its units return to stock." confirmLabel="Cancel order" onCancel={() => setCancel(null)} onConfirm={() => { if (cancel) doCancel(cancel); setCancel(null); }} />
    </div>
  );
}
