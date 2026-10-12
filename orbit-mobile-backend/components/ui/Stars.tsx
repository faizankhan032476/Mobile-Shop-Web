import { Star } from "lucide-react";
export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value} out of 5${count ? `, ${count} demo ratings` : ""}`}>
      <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted">({count})</span>}
    </span>
  );
}
