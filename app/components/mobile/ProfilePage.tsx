'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/auth/supabase/client';
import { 
  Heart, 
  ShieldCheck, 
  Plus, 
  List, 
  Tag, 
  User, 
  Bell, 
  HelpCircle, 
  ShieldAlert, 
  LogOut, 
  ChevronRight,
  Loader2,
  Store,
  MessageSquare
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  email_verified: boolean;
  has_shop?: boolean;
}

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    activeListings: 0,
    totalListings: 0,
    offersCount: 0,
    viewsCount: 0,
  });

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        // 1. Current Auth User Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        // 2. Profile Fetching from public.profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        if (profileData) {
          setProfile(profileData);
        } else {
          // Fallback if profile row is missing
          setProfile({
            id: user.id,
            username: user.user_metadata?.full_name || 'User',
            email: user.email || '',
            role: 'regular',
            email_verified: false,
          });
        }

        // 3. Active Listings Count
        const { count: activeCount } = await supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('status', 'active');

        // Total Listings Count
        const { count: totalCount } = await supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', user.id);

        setStats((prev) => ({
          ...prev,
          activeListings: activeCount || 0,
          totalListings: totalCount || 0,
        }));

      } catch (err) {
        console.error('Unexpected error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F6FBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#13BDC4]" />
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="w-full min-h-screen bg-[#F6FBFC] text-slate-800 pb-12">
      {/* Top Header */}
      <div className="bg-[#13BDC4] text-white py-3 px-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div>
          <div className="text-base font-bold tracking-wide uppercase">SANATKAR</div>
          <p className="text-[11px] text-teal-100 font-medium">My Account</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* User Profile Card */}
        <div className="bg-[#13BDC4] rounded-2xl p-4 text-white shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold border border-white/30 uppercase">
                {profile?.username?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-base font-bold leading-tight">{profile?.username}</div>
                <p className="text-[11px] text-teal-100 font-medium">{profile?.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[9px] font-semibold tracking-wider capitalize">
                  {profile?.role === 'regular' ? 'Regular User' : profile?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 pt-2 border-t border-white/20 text-center">
            <div>
              <p className="text-base font-bold">{stats.totalListings}</p>
              <p className="text-[10px] text-teal-100 font-medium">Listings</p>
            </div>
            <div className="border-x border-white/20">
              <p className="text-base font-bold">{stats.offersCount}</p>
              <p className="text-[10px] text-teal-100 font-medium">Offers</p>
            </div>
            <div>
              <p className="text-base font-bold">{stats.viewsCount}</p>
              <p className="text-[10px] text-teal-100 font-medium">Views</p>
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        <Link 
          href="/verify"
          className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Get the verified badge</h3>
              <p className="text-[10px] text-slate-400 font-medium">Build trust with buyers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        {/* Post New Listing Banner */}
        <Link 
          href="/sell"
          className="flex items-center justify-between bg-[#13BDC4] text-white p-3.5 rounded-2xl shadow-sm active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold">Post a new listing</div>
              <p className="text-[10px] text-teal-100 font-medium">Sell your machine to verified buyers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white" />
        </Link>

        {/* SELLING SECTION */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            SELLING & SHOP
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {/* My Shop Item */}
            <Link href="/my-shop" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-[#13BDC4]" />
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">My Shop / Business Page</span>
                  <span className="text-[10px] text-slate-400">Manage store profile and products</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-teal-50 text-[#13BDC4] rounded-full text-[10px] font-bold">
                  {profile?.has_shop ? 'Manage' : 'Setup'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/my-listings" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <List className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">My Listings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                  {stats.activeListings} Active
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/messages" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Messages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-bold">
                  {stats.offersCount} new
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>

            <Link href="/verification" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Verification Status</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold capitalize">
                  {profile?.email_verified ? 'Verified' : profile?.role || 'Regular'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </Link>
          </div>
        </div>

        {/* ACCOUNT SECTION */}
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            ACCOUNT
          </p>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            <Link href="/edit-profile" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Edit Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link href="/favorites" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Saved / Favorites</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link href="/notifications" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link href="/support" className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-semibold text-slate-700">Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ADMIN SECTION */}
        {isAdmin && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              ADMIN
            </p>
            <div className="space-y-2">
              <Link 
                href="/admin"
                className="flex items-center justify-between bg-[#13BDC4] text-white p-3.5 rounded-2xl shadow-2xs active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span className="text-xs font-bold">Admin Panel</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-bold capitalize">
                    {profile?.role}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* LOGOUT BUTTON */}
        <div className="pt-2">
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs text-rose-500 hover:bg-rose-50/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold">Log Out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </div>
  );
}