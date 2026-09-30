'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Loader2, Upload } from 'lucide-react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';
import { fetchJson } from '@/lib/utils/fetchJson';

// Replace these values with the platform's real receiving account.
const PAYMENT_DETAILS = {
  bankName: 'Your bank name',
  accountTitle: 'SANATKAR BUSINESS ACCOUNT',
  accountNumber: 'Add account number',
  iban: 'Add IBAN here',
};

export default function SellerVerificationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?next=/seller-verification');
  }, [authLoading, router, user]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!proofFile || !user) {
      setMessage({ type: 'error', text: 'Please attach a clear payment receipt or screenshot.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const extension = proofFile.name.split('.').pop() || 'jpg';
      const path = `${user.id}/verification-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('shop-images').upload(path, proofFile, { upsert: false });
      if (uploadError) throw new Error(`Proof upload failed: ${uploadError.message}`);
      const { data: urlData } = supabase.storage.from('shop-images').getPublicUrl(path);

      const { data } = await fetchJson('/api/profile/seller-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: urlData.publicUrl }),
      });
      if (!data.success) {
        setMessage({ type: 'error', text: data.message || 'Could not submit verification.' });
        return;
      }
      setMessage({ type: 'success', text: 'Payment proof submitted. Admin review is expected within 24 hours.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-[#F3F4F6]" />;

  if (user.role !== 'seller') {
    return (
      <>
        <Navbar forceSolid />
        <main className="min-h-screen bg-[#F3F4F6] px-4 pb-16 pt-28 sm:px-6">
          <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
            <BadgeCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h1 className="text-2xl font-black text-slate-900">Become a seller first</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Seller verification is available after your seller account has been approved.</p>
            <Link href="/become-seller" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20">Become a Seller</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar forceSolid />
      <main className="min-h-screen bg-[#F3F4F6] px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"><ArrowLeft size={15} /> Back to profile</Link>
          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BadgeCheck size={25} /></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Seller verification</p><h1 className="mt-1 text-3xl font-black text-slate-900">Get the verified seller badge</h1><p className="mt-2 text-sm leading-6 text-slate-500">Verified sellers are easier to trust, reach more buyers, and can receive faster sales.</p></div>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
            <section className="rounded-3xl border border-primary/20 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-primary">Verification fee</p>
              <p className="mt-2 text-4xl font-black text-slate-900">Rs 10,000</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Transfer the fee to the account below, then attach your payment proof. Admin review is expected within 24 hours.</p>
              <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                {Object.entries(PAYMENT_DETAILS).map(([label, value]) => <div key={label} className="flex items-start justify-between gap-3"><span className="capitalize text-slate-500">{label.replace(/([A-Z])/g, ' $1')}</span><span className="text-right font-bold text-slate-800">{value}</span></div>)}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3"><span className="font-bold text-slate-500">Amount</span><span className="font-black text-primary">Rs 10,000</span></div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
              <h2 className="text-lg font-black text-slate-900">Attach payment proof</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a receipt or screenshot showing the amount and transaction reference.</p>
              <label className="relative mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-5 text-center hover:border-primary">
                {preview ? <img src={preview} alt="Payment proof preview" className="absolute inset-0 h-full w-full object-contain bg-slate-100" /> : <><Upload className="mb-2 text-primary" /><span className="text-sm font-bold text-slate-700">Choose payment proof</span><span className="mt-1 text-xs text-slate-400">Image or PDF screenshot</span></>}
                <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="sr-only" />
              </label>
              {proofFile && <p className="mt-3 truncate text-xs font-semibold text-slate-500">{proofFile.name}</p>}
              {message && <div className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<span>{message.text}</span></div>}
              <button type="button" onClick={handleSubmit} disabled={submitting || message?.type === 'success'} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">{submitting && <Loader2 size={17} className="animate-spin" />}{submitting ? 'Submitting...' : 'Submit verification request'}</button>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
