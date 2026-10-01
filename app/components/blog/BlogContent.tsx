export default function BlogContent({ content }: { content: string }) {
  return <div className="space-y-6 text-lg leading-8 text-slate-600" dir="auto">
    {content.split(/\r?\n\s*\r?\n/).filter(Boolean).map((block, index) => {
      if (block.startsWith('## ')) return <h2 key={index} className="pt-5 text-2xl font-bold leading-snug text-slate-900">{block.slice(3)}</h2>;
      if (block.startsWith('### ')) return <h3 key={index} className="pt-3 text-xl font-bold text-slate-900">{block.slice(4)}</h3>;
      const lines = block.split(/\r?\n/);
      if (lines.every(line => line.startsWith('- '))) return <ul key={index} className="list-disc space-y-2 pl-6">{lines.map((line, i) => <li key={i}>{line.slice(2)}</li>)}</ul>;
      return <p key={index} className="whitespace-pre-wrap break-words">{block}</p>;
    })}
  </div>;
}
