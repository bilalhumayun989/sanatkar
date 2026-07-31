'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Loader2, Lock, Mail, Phone, Store, User } from 'lucide-react';
import { fetchJson } from '@/lib/fetchJson';
import { createClient } from '@/lib/supabase/client';

type AccountType = 'user' | 'seller';
const inputClass = 'relative w-full pl-12 pr-5 py-4 rounded-xl bg-[#131b2f]/80 backdrop-blur-md border border-white/10 text-white placeholder-gray-500 focus:border-primary/50 focus:bg-[#131b2f] focus:outline-none text-sm transition-all shadow-inner';

function SignupField({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="block text-sm font-medium text-gray-300 ml-1">{label}</label><div className="relative group/input"><div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/0 rounded-xl opacity-0 group-focus-within/input:opacity-100 transition duration-300 blur-sm pointer-events-none" /><Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />{children}</div></div>;
}

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [username, setUsername] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [phone, setPhone] = useState(''); const [additionalPhone, setAdditionalPhone] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const { response, data } = await fetchJson('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password, phone, additionalPhone: accountType === 'seller' ? additionalPhone : undefined, accountType }) });
      if (!response.ok) setError(data.message || 'Unable to create account.'); else setMessage(data.message || 'Check your email to confirm your account.');
    } catch { setError('Failed to connect to the server.'); } finally { setLoading(false); }
  }

  async function continueWithGoogle() {
    setError(''); setMessage(''); setGoogleLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const next = new URL(window.location.href).searchParams.get('next');
      const redirectTo = next ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : `${origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      setError('Unable to start Google sign-in.');
    } catch (err: any) {
      setError(err.message || 'Unable to continue with Google.');
    } finally { setGoogleLoading(false); }
  }
  return <div className="min-h-screen bg-[#000] flex items-center justify-center px-4 relative overflow-hidden pt-20"><div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-40" /><div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none opacity-40" />
    <div className="w-full max-w-md relative z-10 fade-in-up"><header className="text-center mb-8"><Link href="/" className="inline-flex mb-6"><img src="/logo.png" alt="Sanatkar Logo" className="h-10 w-auto object-contain" /></Link><div className="text-3xl font-bold text-white mb-2">Create an Account</div><p className="text-gray-400 text-sm font-medium">Join Sanatkar to buy and sell industrial inventory</p></header>
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 mb-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]"><form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#131b2f] rounded-xl"><button type="button" onClick={() => setAccountType('user')} className={`py-3 rounded-lg text-sm font-bold transition ${accountType === 'user' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Regular Seller</button><button type="button" onClick={() => setAccountType('seller')} className={`py-3 rounded-lg text-sm font-bold transition ${accountType === 'seller' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Seller Account</button></div>
        <SignupField label="Username" icon={User}><input required minLength={3} value={username} onChange={e => setUsername(e.target.value)} placeholder="Your username" className={inputClass} /></SignupField>
        <SignupField label="Email Address" icon={Mail}><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} /></SignupField>
        <SignupField label="Phone Number" icon={Phone}><input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX XXXXXXX" className={inputClass} /></SignupField>
        {accountType === 'seller' && <SignupField label="Additional Phone Number" icon={Store}><input required type="tel" value={additionalPhone} onChange={e => setAdditionalPhone(e.target.value)} placeholder="Additional contact number" className={inputClass} /></SignupField>}
        <SignupField label="Password" icon={Lock}><input required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`${inputClass} tracking-widest`} /></SignupField>
        {error && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">{error}</p>}{message && <p className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">{message}</p>}
        <button disabled={loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 disabled:opacity-70">{loading ? <><Loader2 className="w-5 h-5 animate-spin" />Creating account…</> : <>Sign Up <ArrowRight className="w-4 h-4" /></>}</button>
      </form>
      <div className="mt-6">
        <div className="relative flex items-center justify-center my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div><span className="relative bg-[#060816] px-3 text-xs uppercase tracking-[0.25em] text-gray-500">Or</span></div>
        <button type="button" onClick={continueWithGoogle} disabled={googleLoading || loading} className="w-full border border-white/10 bg-white/5 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">{googleLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Connecting...</> : <><span className="text-base font-bold">G</span>Continue with Google</>}</button>
      </div>
      <div className="mt-8 pt-6 border-t border-white/5 text-center"><p className="text-sm text-gray-400">Already registered? <Link href="/login" className="text-primary font-bold hover:underline">Log in</Link></p></div></div>
    </div></div>;
}
