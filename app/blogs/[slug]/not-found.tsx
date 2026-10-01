import Link from 'next/link';

export default function BlogNotFound() {
  return <div className="px-5 py-24 text-center"><p className="text-sm font-bold text-teal-700">404 · ARTICLE NOT FOUND</p><h1 className="mt-4 text-3xl font-bold">This story isn’t available</h1><p className="mt-4 text-slate-500">It may have been removed or hasn’t been published yet.</p><Link href="/blogs" className="mt-7 inline-block rounded-xl bg-teal-700 px-6 py-3 font-bold text-white">Explore the journal</Link></div>;
}
