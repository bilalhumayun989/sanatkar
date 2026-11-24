'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';
import { refreshOnRealtime } from '@/lib/realtime/client';
type Activation = { status: string; shop_complete: boolean; payment: { amount: number; account_title: string; iban: string; jazzcash_phone: string; demo: boolean } };
export default function SellerActivationPage() {
  const { user, loading, refreshAuth } = useAuth();
  const currentUserId = useRef(user?.id); currentUserId.current = user?.id;
  const [details, setDetails] = useState<Activation | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const requestedUser = currentUserId.current;
    const { data: { session } } = await createClient().auth.getSession();
    if (!session || session.user.id !== requestedUser) return;
    const response = await fetch('/api/profile/seller-activation', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load payment details.');
    if (currentUserId.current === requestedUser) setDetails(result);
  };
  useEffect(() => {
    setDetails(null); setFile(null); setBusy(false); setError('');
    if (!user) return;
    void load().catch(error => setError(error.message));
    return refreshOnRealtime(['profile'], load);
  }, [user?.id]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy || !file) return;
    setBusy(true); setError('');
    const requestedUser = currentUserId.current;
    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session || session.user.id !== requestedUser) throw new Error('Please sign in again.');
      const form = new FormData(); form.append('proof', file);
      const response = await fetch('/api/profile/seller-activation', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: form });
      const result = await response.json();
      if (currentUserId.current !== requestedUser) return;
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to submit screenshot.');
      setFile(null); await load(); await refreshAuth();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to submit screenshot.'); }
    finally { setBusy(false); }
  };
  return <><Navbar forceSolid /><main className="mx-auto min-h-screen max-w-xl px-4 pb-20 pt-32">
    <h1 className="text-2xl font-bold">Verify yourself to start selling</h1>
    <p className="mt-3 text-slate-600">Create your shop, pay the one-time Rs 5,000 seller activation fee, and attach your payment screenshot. After admin approval, you can list unlimited products.</p>
    {loading && <p className="mt-6">Loading…</p>}
    {!loading && !user && <Link href="/login?next=/seller-activation" className="mt-6 inline-block text-primary underline">Sign in to continue</Link>}
    {error && <p role="alert" className="mt-5 text-red-700">{error}</p>}
    {details && !details.shop_complete ? <Link href="/become-seller" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-white">Create your shop first</Link> : details?.status === 'approved' ? <div className="mt-6 rounded-2xl bg-green-50 p-5"><p className="font-bold text-green-800">Approved — unlimited product listings are unlocked.</p><Link href="/seller" className="mt-4 inline-block text-primary underline">List a product</Link></div> : details?.status === 'pending' ? <div role="status" className="mt-6 rounded-2xl bg-amber-50 p-5"><h2 className="font-bold">Payment is under review</h2><p className="mt-2">Your screenshot has been submitted. Listings will unlock automatically after admin approval. Please do not pay again while this request is pending.</p></div> : details && <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border bg-white p-6">
      {details.status === 'rejected' && <p className="text-red-700">Your previous screenshot was rejected. Check your payment and submit a clear, correct screenshot.</p>}
      <h2 className="text-lg font-bold">One-time payment: Rs {details.payment.amount.toLocaleString()}</h2>
      <dl className="space-y-3 text-sm"><div><dt className="text-slate-500">Account title</dt><dd>{details.payment.account_title}</dd></div><div><dt className="text-slate-500">IBAN</dt><dd className="break-all font-mono">{details.payment.iban}</dd></div><div><dt className="text-slate-500">JazzCash phone number</dt><dd className="font-mono">{details.payment.jazzcash_phone}</dd></div></dl>
      {details.payment.demo && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Demo payment details for testing. Do not transfer money to these placeholders.</p>}
      <label className="block text-sm font-semibold">Attach payment screenshot (JPG, PNG, WebP; up to 5 MB)
        <div className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/[0.03] px-5 py-4 transition-colors hover:border-primary hover:bg-primary/[0.06]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800">{file ? file.name : 'Upload Payment Screenshot'}</p>
            <p className="mt-0.5 text-xs text-slate-400">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'JPG, PNG or WebP · Max 5 MB'}</p>
          </div>
          {file && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" required disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} />
      </label>
      <button type="submit" disabled={busy || !file} className="w-full rounded-xl bg-primary px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit for admin approval'}</button>
      <p className="text-sm text-slate-600">An admin will verify your Rs 5,000 payment. You can list products only after approval.</p>
    </form>}
    <Link href="/profile" className="mt-6 inline-block text-primary underline">Back to profile</Link>
  </main><Footer /></>;
}
