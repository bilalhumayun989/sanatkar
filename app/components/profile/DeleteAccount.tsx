'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/auth/supabase/client';

export default function DeleteAccount() {
  const passwordId = useId();
  const [expanded, setExpanded] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !password.trim()) return;
    setBusy(true); setError('');
    try {
      const client = createClient();
      const { data: { session } } = await client.auth.getSession();
      if (!session) throw new Error('Please sign in again.');
      const response = await fetch('/api/account', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Unable to delete your account.');
      setPassword('');
      // The identity has already been removed server-side. Clear the local SDK session.
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      window.location.replace('/login?account_deleted=1');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete your account.');
      setPassword(''); setBusy(false);
    }
  };

  return <section className="mt-6 rounded-2xl border border-red-200 bg-white p-5 text-left">
    <h2 className="text-base font-bold text-red-700">Delete account</h2>
    <p className="mt-2 text-sm text-slate-600">Permanently delete your account, shop, listings, conversations, offers, orders, and related account records. Shared conversations will also be removed for other participants. This cannot be undone.</p>
    {!expanded ? <button type="button" onClick={() => setExpanded(true)} className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete my account</button> :
      <form onSubmit={submit} className="mt-4 space-y-3" aria-busy={busy}>
        <label htmlFor={passwordId} className="block text-sm font-semibold text-slate-800">Current password</label>
        <input id={passwordId} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required maxLength={1024} disabled={busy} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900" />
        <p className="text-xs text-slate-600">Signed in with Google? <Link href="/forgot-password" className="underline">Set a password first</Link>, then return here.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => { setExpanded(false); setPassword(''); setError(''); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={busy || !password.trim()} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Deleting account…' : 'Permanently delete account'}</button>
        </div>
      </form>}
  </section>;
}
