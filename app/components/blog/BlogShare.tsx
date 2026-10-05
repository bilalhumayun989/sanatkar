'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

export default function BlogShare({ title }: { title: string }) {
  const [message, setMessage] = useState('');
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage('Link copied');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessage('Unable to share. Copy the link from your address bar.');
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Link copied');
    } catch { setMessage('Copy the link from your address bar.'); }
  }
  return <div className="flex flex-wrap items-center gap-2">
    <button onClick={() => void share()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-[#0092B8] hover:text-[#0092B8]"><Share2 size={14} /> Share article</button>
    <button onClick={() => void copy()} aria-label="Copy article link" className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:text-[#0092B8]">{message === 'Link copied' ? <Check size={16} /> : <Link2 size={16} />}</button>
    <span role="status" className="text-xs text-teal-700">{message}</span>
  </div>;
}
