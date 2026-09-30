'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<string[]>([]);
  const current = images[index];
  const move = (direction: number) => setIndex(previous => (previous + direction + images.length) % images.length);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="relative flex h-[260px] items-center justify-center bg-slate-50 sm:h-[340px] lg:h-[380px] lg:max-h-[55vh]">
      {current && !broken.includes(current) ? <img src={current} alt={`${title}, photo ${index + 1}`} onError={() => setBroken(previous => [...previous, current])} className="h-full w-full object-contain p-4 sm:p-5" /> : <div className="flex flex-col items-center gap-3 text-slate-400"><Package size={48} strokeWidth={1} /><span className="text-sm">Photo unavailable</span></div>}
      {images.length > 1 && <><button type="button" aria-label="Previous photo" onClick={() => move(-1)} className="absolute left-3 rounded-full border border-slate-200 bg-white/95 p-2.5 shadow-sm hover:text-primary"><ChevronLeft size={18} /></button><button type="button" aria-label="Next photo" onClick={() => move(1)} className="absolute right-3 rounded-full border border-slate-200 bg-white/95 p-2.5 shadow-sm hover:text-primary"><ChevronRight size={18} /></button></>}
      {images.length > 0 && <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-medium text-white">{index + 1} / {images.length}</span>}
    </div>
    {images.length > 1 && <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3">{images.map((src, i) => <button key={`${src}-${i}`} type="button" aria-label={`View photo ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)} className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50 p-1 ${index === i ? 'border-primary' : 'border-transparent hover:border-slate-300'}`}>{broken.includes(src) ? <Package className="mx-auto text-slate-400" /> : <img src={src} alt="" onError={() => setBroken(previous => [...previous, src])} className="h-full w-full object-contain" />}</button>)}</div>}
  </div>;
}
