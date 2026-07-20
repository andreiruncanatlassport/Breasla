"use client";

import { useEffect, useState } from "react";

function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

export function HomeStats({ firme, domenii, judete }: { firme: number; domenii: number; judete: number }) {
  const firmeVal = useCountUp(firme);
  const domeniiVal = useCountUp(domenii);
  const judeteVal = useCountUp(judete);

  return (
    <div className="mt-12 flex flex-wrap gap-3">
      <div className="rounded-2xl border border-line bg-surface/75 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
        <p className="font-mono-num text-2xl font-bold text-ink">{firmeVal.toLocaleString("ro-RO")}</p>
        <p className="mt-0.5 text-xs text-ink-soft">firme verificate</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface/75 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
        <p className="font-mono-num text-2xl font-bold text-seal">{domeniiVal}</p>
        <p className="mt-0.5 text-xs text-ink-soft">domenii</p>
      </div>
      <div className="rounded-2xl border border-line bg-surface/75 px-5 py-3.5 shadow-[var(--shadow-md)] backdrop-blur-sm">
        <p className="font-mono-num text-2xl font-bold text-teal">{judeteVal}</p>
        <p className="mt-0.5 text-xs text-ink-soft">județe</p>
      </div>
    </div>
  );
}
