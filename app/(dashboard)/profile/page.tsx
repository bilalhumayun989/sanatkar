'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { User, Mail, Phone, CreditCard, Loader2, Save, ArrowLeft, CheckCircle2, AlertCircle, Store } from 'lucide-react';

interface ProfileRecord {
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  cnic?: string | null;
  role?: string | null;
  seller_status?: string | null;
  total_listings_posted?: number | null;
  shop_name?: string | null;
  shop_description?: string | null;
  shop_image_url?: string | null;
  city?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before making any decisions
    if (authLoading) return;

    // Only redirect if auth is done AND user is definitely not logged in
    if (!user) {
      router.replace('/login?next=/profile');
      return;
    }

    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profiles').select('full_name, username, email, phone, cnic, role, seller_status, total_listings_posted, shop_name, shop_description, shop_image_url, city')
          .eq('id', user.id).maybeSingle();
        if (!error && data) {
          setProfile(data);
          setFullName(data.full_name || '');
          setUsername(data.username || '');
          setPhone(data.phone || '');
          setCnic(data.cnic || '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [authLoading, router, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const updates: Partial<ProfileRecord> = { full_name: fullName, username, phone };
      if (profile?.role === 'seller') updates.cnic = cnic;
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setMessage({ text: t('profile_updated'), type: 'success' });
    } catch (err) {
      console.error('Failed to save profile', err);
      setMessage({ text: t('unable_update_profile'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isSeller = profile?.role === 'seller';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <Navbar forceSolid />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 pt-32">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mb-2">
              {t('account_management')}
            </p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">{t('profile_settings')}</h1>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-primary transition-colors shrink-0">
            <ArrowLeft size={16} /> {t('back_to_home')}
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-xl shadow-slate-100/50">
          {(authLoading || loading) ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="mb-3 animate-spin text-primary" size={32} />
              <p className="text-sm font-semibold">{t('loading_profile')}</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              {/* Account Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                    {(fullName || username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{fullName || username || t('profile_settings')}</h2>
                    <p className="text-xs text-slate-500">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isSeller ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {profile?.role || 'regular'}
                  </span>
                  {isSeller && profile?.seller_status && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      profile.seller_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      profile.seller_status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {profile.seller_status === 'approved' && <CheckCircle2 size={12} />}
                      {profile.seller_status}
                    </span>
                  )}
                </div>
              </div>

              {/* Quota and Seller Action */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {profile?.role === 'regular' && (
                  <div className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl flex-1 shadow-sm">
                    <div className="w-12 h-12 bg-[#09ACC9]/10 text-[#09ACC9] rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                      {(profile?.total_listings_posted ?? 0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Listings Quota</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {(profile?.total_listings_posted ?? 0)} of 5 listings used
                      </p>
                      {(profile?.total_listings_posted ?? 0) >= 5 && (
                        <p className="text-xs text-rose-500 font-bold mt-0.5">Upgrade to post more</p>
                      )}
                    </div>
                  </div>
                )}
                {profile?.role === 'regular' && (profile.seller_status === 'pending' ? (
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 font-bold text-amber-700 md:flex-none">
                    <Loader2 size={18} /> Requested
                  </div>
                ) : (
                  <button type="button" onClick={() => router.push('/become-seller')} className="flex-1 justify-center gap-2 rounded-2xl bg-[#09ACC9] px-6 py-4 font-bold text-white shadow-lg shadow-[#09ACC9]/20 transition-colors hover:bg-[#0092b8] md:flex-none">
                    <Store size={18} className="inline-block" /> {profile.seller_status === 'rejected' ? 'Become a Seller Again' : 'Become a Seller'}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> {t('full_name')}
                  </label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder={t('full_name_placeholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> {t('username_label')}
                  </label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder={t('username_placeholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" /> {t('email_label')}
                  </label>
                  <input type="email" value={profile?.email || user?.email || ''} disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" /> {t('phone_label')}
                  </label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder={t('phone_placeholder')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>

                {isSeller && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CreditCard size={16} className="text-slate-400" /> {t('cnic_label')}
                      </span>
                      <span className="text-xs text-primary font-semibold">{t('seller_only_field')}</span>
                    </label>
                    <input type="text" value={cnic} onChange={e => setCnic(e.target.value)}
                      placeholder={t('cnic_placeholder')}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all" />
                  </div>
                )}
              </div>

              {message && (
                <div className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-semibold border ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{message.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end border-t border-slate-100 pt-6">
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60 active:scale-95">
                  {saving ? (
                    <><Loader2 className="animate-spin" size={16} /> {t('saving_changes')}</>
                  ) : (
                    <><Save size={16} /> {t('save_changes')}</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
      </main>
      <Footer />
    </div>
  );
}
