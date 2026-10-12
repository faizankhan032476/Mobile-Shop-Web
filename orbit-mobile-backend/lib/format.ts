export const formatPKR = (n: number) =>
  "Rs " + Math.round(n).toLocaleString("en-PK");

export const discountPct = (price: number, original?: number) =>
  original && original > price ? Math.round(((original - price) / original) * 100) : 0;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
