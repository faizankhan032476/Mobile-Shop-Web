"use client";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "@/lib/api-client";
import { useApiData } from "@/lib/use-api-data";
import { formatDate, formatPKR } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_LABEL, STATUS_LABEL } from "@/lib/labels";
import { refreshCatalogs } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Detail = Order & { history: { from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; created_at: string }[] };

export default function AdminOrders() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [status, setFilter] = useState("");
  const [page, setPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setDq(q); setPage(1); }, 300); return () => clearTimeout(t); }, [q]);
  const url = `/api/admin/orders?page=${page}&pageSize=25${status ? `&status=${status}` : ""}${dq ? `&q=${encodeURIComponent(dq)}` : ""}`;
  const { data: list, error, loading, reload, total } = useApiData<Order[]>(url);

  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useApiData<Detail>(openId ? `/api/admin/orders/${openId}` : null);
  const [cancel, setCancel] = useState(false);
  const sel = openId ? detail.data : null;

  const patch = async (body: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    try { await api(`/api/admin/orders/${openId}`, { method: "PATCH", json: body }); toast("Order updated"); detail.reload(); reload(); if (body.status === "cancelled") void refreshCatalogs(); }
    catch (e) { toast(e instanceof ApiClientError ? e.message : "Couldn’t update the order", "error"); }
  };

  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Orders</h1><p className="text-sm text-muted">{total} order{total === 1 ? "" : "s"} in the database.</p></div>
      <div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="ao-q">Search orders</label><input id="ao-q" className="input max-w-xs" placeholder="Search order, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ao-s">Status</label><select id="ao-s" className="input !w-auto" value={status} onChange={(e) => { setFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
      {error ? <p role="alert" className="text-sale">{error}</p> : loading ? <p className="text-muted" aria-live="polite">Loading orders…</p> : (
        <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Payment</th><th className="text-right">Total</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">{list?.map((o) => <tr key={o.id}><td className="p-3 font-semibold">{o.number}</td><td>{o.customer.name}</td><td>{formatDate(o.createdAt)}</td><td>{STATUS_LABEL[o.status]}</td><td>{PAYMENT_LABEL[o.paymentStatus]}</td><td className="text-right">{formatPKR(o.total)}</td><td className="p-3 text-right"><button className="btn btn-outline !min-h-9" onClick={() => setOpenId(o.id)}>Details</button></td></tr>)}</tbody></table>
          {list?.length === 0 && <p className="p-8 text-center text-sm text-muted">No orders match.</p>}</div>)}
      <div className="flex items-center justify-between text-sm"><button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-muted">Page {page}</span><button className="btn btn-outline" disabled={page * 25 >= total} onClick={() => setPage(page + 1)}>Next</button></div>

      {openId && (
        <div role="dialog" aria-modal="true" aria-label="Order details" className="fixed inset-0 z-[90] grid place-items-center bg-ink/50 p-4" onClick={() => setOpenId(null)}>
          <div className="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {!sel ? <p className="text-muted">{detail.error || "Loading…"}</p> : <>
              <div className="flex justify-between"><h2 className="text-xl font-bold">{sel.number}</h2><button className="text-sm font-semibold text-muted" onClick={() => setOpenId(null)}>Close</button></div>
              <p className="text-sm">{sel.customer.name}<br />{sel.customer.email} · {sel.customer.phone}<br />{sel.shipping.address}, {sel.shipping.city} {sel.shipping.postalCode}<br /><span className="text-muted">Cash on Delivery{sel.discountCode ? ` · code ${sel.discountCode}` : ""}</span></p>
              <ul className="divide-y divide-line text-sm">{sel.items.map((i) => <li key={i.sku + i.color + i.storage} className="flex justify-between py-2"><span>{i.qty} × {i.name} <span className="text-muted">({i.color}, {i.storage})</span></span><span>{formatPKR(i.qty * i.unitPrice)}</span></li>)}</ul>
              <p className="flex justify-between font-bold"><span>Total</span><span>{formatPKR(sel.total)}</span></p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label htmlFor="os" className="mb-1 block text-sm font-semibold">Order status</label>
                  <select id="os" className="input" value={sel.status} disabled={sel.status === "cancelled"} onChange={(e) => (e.target.value === "cancelled" ? setCancel(true) : void patch({ status: e.target.value as OrderStatus }))}>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
                <div><label htmlFor="ps" className="mb-1 block text-sm font-semibold">Payment</label>
                  <select id="ps" className="input" value={sel.paymentStatus} onChange={(e) => void patch({ paymentStatus: e.target.value as PaymentStatus })}>{(Object.keys(PAYMENT_LABEL) as PaymentStatus[]).map((s) => <option key={s} value={s}>{PAYMENT_LABEL[s]}</option>)}</select></div>
              </div>
              {sel.status === "cancelled" && <p className="text-xs text-muted">Cancelled orders can’t be reopened. Their stock was returned.</p>}
              <div><h3 className="text-sm font-bold">History</h3><ul className="mt-1 space-y-1 text-xs text-muted">{sel.history.map((h, i) => <li key={i}>{formatDate(h.created_at)}: {h.from_status ? `${STATUS_LABEL[h.from_status]} → ` : ""}{STATUS_LABEL[h.to_status]}{h.note ? ` (${h.note})` : ""}</li>)}</ul></div>
            </>}
          </div>
        </div>)}
      <ConfirmDialog open={cancel} title="Cancel this order?" body="The order is marked cancelled and its units return to stock. This can’t be undone." confirmLabel="Cancel order" onCancel={() => setCancel(false)} onConfirm={() => { setCancel(false); void patch({ status: "cancelled" }); }} />
    </div>
  );
}
