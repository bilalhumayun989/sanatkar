'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function BlogCover({ src, title, className = '', priority = false }: { src: string; title: string; className?: string; priority?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <div className={`relative isolate w-full min-w-0 overflow-hidden bg-[#f0f5f5] ${className}`}>
    {src && failedSrc !== src ? (
      // Keep covers of any aspect ratio fully inside their frame.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={title} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailedSrc(src)} className="absolute inset-0 block h-full w-full object-contain p-3 sm:p-5" />
    ) : <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#12343a] via-[#17616a] to-[#09acc9] text-white/70"><BookOpen size={56} strokeWidth={1} /><span className="text-[10px] font-bold uppercase tracking-[0.25em]">Sanatkar journal</span></div>}
  </div>;
}
