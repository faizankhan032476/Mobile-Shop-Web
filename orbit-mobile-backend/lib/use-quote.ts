"use client";
import { useEffect, useState } from "react";
import { api, ApiClientError } from "./api-client";
import type { PricedLine } from "./pricing";

export interface Quote { subtotal: number; discount: number; shipping: number; total: number; discountCode: string | null }

/** Server-calculated totals for the current cart (and optional discount code). */
export function useQuote(lines: PricedLine[], code: string) {
  const [state, setState] = useState<{ quote: Quote | null; error: string; loading: boolean }>({ quote: null, error: "", loading: false });
  const sig = JSON.stringify([lines.map((l) => [l.productId, l.color, l.storage, l.qty]), code]);
  useEffect(() => {
    if (lines.length === 0) return;
    let live = true;
    api<{ data: Quote }>("/api/quote", { method: "POST", json: { items: lines.map((l) => ({ productId: l.productId, color: l.color, storage: l.storage, quantity: l.qty })), discountCode: code || undefined } })
      .then((r) => live && setState({ quote: r.data, error: "", loading: false }))
      .catch((e) => live && setState({ quote: null, error: e instanceof ApiClientError ? e.message : "Couldn’t calculate totals.", loading: false }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sig` captures the relevant inputs
  }, [sig]);
  return state;
}
