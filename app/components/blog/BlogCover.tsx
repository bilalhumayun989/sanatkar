'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

export default function BlogCover({ src, title, className = '' }: { src: string; title: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <div className={`relative overflow-hidden bg-[#12343a] ${className}`}>
    {src && failedSrc !== src ? (
      // External editorial images are supplied by administrators.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={title} onError={() => setFailedSrc(src)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    ) : <div className="flex h-full min-h-40 items-center justify-center bg-gradient-to-br from-[#12343a] via-[#17616a] to-[#09acc9] text-white/70"><BookOpen size={64} strokeWidth={1} /></div>}
  </div>;
}
