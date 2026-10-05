import type { ReactNode } from 'react';

/** A mobile banner that becomes a sidebar beside the desktop storefront. */
export default function HomeAdSlot({ children }: { children?: ReactNode }) {
  return (
    <aside aria-label="Advertisement" className="min-w-0 self-start lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400">Advertisement</p>
      <div id="home-sidebar-ad" data-ad-slot="home-sidebar" className="h-32 w-full overflow-hidden rounded-xl border border-slate-200 bg-white/70 sm:h-40 lg:h-[600px]">
        {children}
      </div>
    </aside>
  );
}
