export default function BlogContent({ content }: { content: string }) {
  return <div className="space-y-6 break-words text-base leading-8 text-slate-600 sm:text-lg sm:leading-9" dir="auto">
    {content.split(/\r?\n\s*\r?\n/).filter(Boolean).map((block, index) => {
      if (block.startsWith('## ')) return <h2 id={`article-section-${index}`} key={index} className="scroll-mt-36 border-t border-slate-100 pt-8 text-2xl font-bold leading-snug tracking-tight text-slate-900 lg:scroll-mt-24 sm:text-3xl">{block.slice(3)}</h2>;
      if (block.startsWith('### ')) return <h3 id={`article-section-${index}`} key={index} className="scroll-mt-36 pt-4 text-xl font-bold leading-snug text-slate-900 lg:scroll-mt-24 sm:text-2xl">{block.slice(4)}</h3>;
      const lines = block.split(/\r?\n/);
      if (lines.every(line => line.startsWith('- '))) return <ul key={index} className="list-disc space-y-3 ps-6 marker:text-[#0092B8]">{lines.map((line, i) => <li key={i} className="ps-1">{line.slice(2)}</li>)}</ul>;
      return <p key={index} className="whitespace-pre-wrap">{block}</p>;
    })}
  </div>;
}
