import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

type Section = { title: string; paragraphs: string[] };

export default function LegalPage({ title, description, sections, privacy = false }: { title: string; description: string; sections: Section[]; privacy?: boolean }) {
  const Icon = privacy ? ShieldCheck : FileText;
  return <div className="min-h-screen bg-[#F6FBFC] text-slate-800">
    <Navbar forceSolid />
    <div className="pt-32 lg:pt-16">
      <header className="border-b border-slate-100 bg-white px-5 py-10 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-[#0092B8]"><ArrowLeft size={16} /> Back to Sanatkar</Link>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0092B8]/10 text-[#0092B8]"><Icon size={25} /></div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#0092B8]">Sanatkar marketplace</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
          <p className="mt-5 text-xs font-medium text-slate-400">Last updated: October 5, 2026</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[260px_1fr] lg:py-14">
        <aside><nav aria-label="On this page" className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">On this page</h2>
          <ol className="space-y-3">{sections.map((section, index) => <li key={section.title}><a href={`#section-${index + 1}`} className="block text-sm font-semibold text-slate-600 hover:text-[#0092B8]">{index + 1}. {section.title}</a></li>)}</ol>
        </nav></aside>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-9">{sections.map((section, index) => <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-36 lg:scroll-mt-24">
            <h2 className="mb-4 text-xl font-bold text-slate-900">{index + 1}. {section.title}</h2>
            <div className="space-y-3">{section.paragraphs.map(paragraph => <p key={paragraph} className="break-words text-sm leading-7 text-slate-600 sm:text-base">{paragraph}</p>)}</div>
          </section>)}</div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <a href="mailto:support@sanatkar.com" className="text-sm font-bold text-[#0092B8]">Contact support</a>
            <Link href={privacy ? '/terms-and-conditions' : '/privacy-policy'} className="inline-flex items-center gap-1 text-sm font-bold text-[#0092B8]">{privacy ? 'Terms & Conditions' : 'Privacy Policy'} <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>;
}
