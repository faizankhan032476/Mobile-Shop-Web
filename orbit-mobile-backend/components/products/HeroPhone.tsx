"use client";
import { useRef } from "react";
import { PhoneArt } from "@/components/ui/PhoneArt";

/** CSS-3D phone pair that tilts with the pointer. No WebGL, so nothing to fail to load. */
export function HeroPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.PointerEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !ref.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `rotateY(${x * 24}deg) rotateX(${-y * 16}deg)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div className="phone-stage mx-auto w-full max-w-md py-6" onPointerMove={move} onPointerLeave={reset}>
      <div className="phone-float">
        <div ref={ref} className="phone-3d relative mx-auto h-[420px] w-[300px]">
          <div className="absolute left-0 top-6 h-[380px] opacity-90 drop-shadow-2xl" style={{ transform: "translateZ(-60px) rotate(-8deg)" }}>
            <PhoneArt view="back" color="#9aa7c7" className="h-full w-auto" label="Phone, back view" />
          </div>
          <div className="absolute right-0 top-0 h-[400px] drop-shadow-2xl" style={{ transform: "translateZ(40px) rotate(6deg)" }}>
            <PhoneArt view="front" color="#2d2e30" className="h-full w-auto" label="Phone, front view" />
          </div>
        </div>
      </div>
    </div>
  );
}
