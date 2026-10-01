'use client';

export default function BlogError({ reset }: { reset: () => void }) {
  return <div role="alert" className="px-5 py-24 text-center"><h1 className="text-2xl font-bold">The journal is temporarily unavailable</h1><p className="mt-3 text-slate-500">We couldn’t load the articles. Please try again.</p><button onClick={reset} className="mt-6 rounded-xl bg-teal-700 px-6 py-3 font-bold text-white">Try again</button></div>;
}
