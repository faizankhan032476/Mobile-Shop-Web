/** Generated phone artwork used when a product has no (or a broken) image URL. */
export type PhoneView = "front" | "back" | "side";

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export function PhoneArt({ color = "#2d2e30", view = "front", label, className = "" }: { color?: string; view?: PhoneView; label?: string; className?: string }) {
  const id = `g${color.slice(1)}${view}`;
  const w = view === "side" ? 36 : 200;
  return (
    <svg viewBox={`0 0 ${view === "side" ? 60 : 220} 420`} className={className} role="img" aria-label={label ?? `${view} view`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(color, 28)} /><stop offset="1" stopColor={shade(color, -34)} />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d2a52" /><stop offset="1" stopColor="#5d7bff" /></linearGradient>
      </defs>
      {view === "side" ? (
        <rect x="12" y="10" width={w - 12} height="400" rx="9" fill={`url(#${id})`} />
      ) : (
        <>
          <rect x="10" y="8" width="200" height="404" rx="36" fill={`url(#${id})`} />
          {view === "front" ? (
            <>
              <rect x="18" y="16" width="184" height="388" rx="29" fill="#0b0f1a" />
              <rect x="24" y="22" width="172" height="376" rx="24" fill={`url(#${id}s)`} />
              <rect x="88" y="32" width="44" height="12" rx="6" fill="#0b0f1a" />
              <text x="110" y="150" textAnchor="middle" fontSize="54" fontWeight="600" fill="#fff" fontFamily="system-ui">9:41</text>
              <text x="110" y="176" textAnchor="middle" fontSize="12" fill="#ffffffcc" fontFamily="system-ui">Sunday, 11 October</text>
            </>
          ) : (
            <>
              <rect x="26" y="26" width="86" height="92" rx="22" fill={shade(color, -50)} opacity=".55" />
              {[[48, 50], [48, 92], [88, 70]].map(([cx, cy], i) => (
                <g key={i}><circle cx={cx} cy={cy} r="15" fill="#10131c" /><circle cx={cx} cy={cy} r="8" fill="#2a3552" /><circle cx={cx - 3} cy={cy - 3} r="2.4" fill="#ffffff88" /></g>
              ))}
              <circle cx="110" cy="214" r="13" fill={shade(color, -20)} opacity=".4" />
            </>
          )}
        </>
      )}
    </svg>
  );
}
