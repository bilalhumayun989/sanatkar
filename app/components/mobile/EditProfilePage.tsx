'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase/client';
import { ArrowLeft, Camera, Loader2, Check } from 'lucide-react';

export default function EditProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields (Mapped to public.profiles table schema)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    cnic: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/profile/me', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Profile could not be loaded.');
        const data = result.profile;
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            username: data.username || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            cnic: data.cnic || '',
          });
        } else {
          setFormData((prev) => ({
            ...prev,
            email: user.email || '',
          }));
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMessage({ type: 'error', text: 'User session expired. Please log in again.' });
        return;
      }

      const response = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          username: formData.username || formData.full_name,
          phone: formData.phone,
          cnic: formData.cnic,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Profile update failed.');

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => router.push('/mobile-profile'), 1200);
    } catch (err: unknown) {
      console.error('Update profile error:', err);
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setMessage({ type: 'error', text: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F6FBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#13BDC4]" />
      </div>
    );
  }

  const avatarInitial = formData.full_name 
    ? formData.full_name.charAt(0).toUpperCase() 
    : formData.username ? formData.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full min-h-screen bg-[#F6FBFC] text-slate-800 pb-10">
      {/* Top Header */}
      <div className="bg-[#13BDC4] text-white py-3.5 px-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <button 
          onClick={() => router.back()} 
          className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-bold tracking-wide">Edit Profile</h1>
        <div className="w-5" />
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Avatar Section */}
        <div className="flex justify-center pt-2">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-[#13BDC4] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
              {avatarInitial}
            </div>
            <button 
              type="button" 
              className="absolute bottom-0 right-0 bg-[#13BDC4] p-2 rounded-full border-2 border-white text-white shadow-xs active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.type === 'success' && <Check className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 px-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Joseph 090"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#13BDC4] transition-colors shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 px-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#13BDC4] transition-colors shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 px-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-500 cursor-not-allowed shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 px-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="04235678909"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#13BDC4] transition-colors shadow-2xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 px-1">CNIC</label>
            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="35201-XXXXXXX-X"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#13BDC4] transition-colors shadow-2xs"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#13BDC4] text-white py-3.5 rounded-xl text-xs font-bold shadow-sm active:scale-[0.99] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}