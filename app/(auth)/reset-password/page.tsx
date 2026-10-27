'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        throw new Error('No recovery session was found. Request a new reset email and open its link in this same browser.');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/login?password_reset=1');
    } catch (error) {
      setMessage(error instanceof Error
        ? error.message
        : 'Unable to update the password. Request a new reset email and open its link in this same browser.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#EAEFF9] p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
        <p className="text-sm text-slate-600">Choose a password with at least 8 characters.</p>
        <input type="password" autoComplete="new-password" minLength={8} required value={password}
          onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border p-3" />
        {message && <p role="alert" className="text-sm text-red-600">{message}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-[#13BDC4] p-3 font-semibold text-white disabled:opacity-60">
          {loading ? 'Updating…' : 'Update password'}
        </button>
        <Link href="/login" className="block text-center text-sm text-slate-600">Return to login</Link>
      </form>
    </main>
  );
}
