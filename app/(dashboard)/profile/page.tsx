'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { createClient } from '@/lib/auth/supabase/client';
import { useAuth } from '@/lib/AuthContext';

interface ProfileRecord {
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/profile');
      return;
    }

    const loadProfile = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('profiles').select('username, email, phone, role').eq('id', user?.id).maybeSingle();
        if (!error && data) {
          setProfile(data);
          setUsername(data.username || '');
          setPhone(data.phone || '');
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
    setMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({ username, phone }).eq('id', user.id);
      if (error) throw error;
      setProfile((prev) => prev ? { ...prev, username, phone } : { username, phone, email: user.email, role: 'user' });
      setMessage('Profile updated successfully.');
    } catch (err) {
      console.error('Failed to save profile', err);
      setMessage('Unable to update your profile right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-black">
      <Navbar forceSolid />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-28">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Profile</p>
            <h1 className="text-3xl font-black text-gray-900">Your account</h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-gray-600 hover:text-primary">Back home</Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          {loading ? (
            <p className="text-sm text-gray-500">Loading your profile…</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Email</label>
                  <input value={profile?.email || user?.email || ''} disabled className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Role</label>
                  <input value={profile?.role || 'user'} disabled className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600" />
                </div>
              </div>

              {message ? <p className="text-sm text-green-600">{message}</p> : null}

              <button type="submit" disabled={saving} className="rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
