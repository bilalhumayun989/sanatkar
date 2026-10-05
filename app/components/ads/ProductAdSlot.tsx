import type { ReactNode } from 'react';

export default function ProductAdSlot({ slot, children }: { slot: number; children?: ReactNode }) {
  return (
    <aside aria-label="Advertisement" className="col-span-full min-w-0 py-3">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400">Advertisement</p>
      <div data-ad-slot={`products-inline-${slot}`} className="h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-white/70 sm:h-40">
        {children}
      </div>
    </aside>
  );
}
