'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bell, Heart, Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';

interface UserProfile {
  username: string;
  full_name?: string;
}

interface Category {
  id: string;
  name: string;
}

const QUICK_FILTERS = ['New Machines', 'Used', 'Accessories'];

export default function MobileHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadOffersCount, setUnreadOffersCount] = useState<number>(0);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('New Machines');

  // Filter Modal & Category States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('Any');
  const [priceRange, setPriceRange] = useState<number>(100);

  useEffect(() => {
    if (isFilterOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isFilterOpen]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        const { count } = await supabase
          .from('offers')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('status', 'pending');

        if (count !== null) setUnreadOffersCount(count);
      }

      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true);

      if (catData) setCategories(catData);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const displayName = profile?.username || profile?.full_name || (user ? 'User' : 'Sanat Kaar');
  const shouldHideHeader = pathname === '/messages' || pathname.startsWith('/messages/') || pathname === '/chats' || pathname.startsWith('/chats/') || pathname === '/sell' || pathname.startsWith('/sell/') || pathname === '/mobile-profile' || pathname.startsWith('/mobile-profile/') || pathname === '/edit-profile' || pathname.startsWith('/edit-profile/') || pathname === '/my-listings' || pathname.startsWith('/my-listings/') || pathname === '/my-shop' || pathname.startsWith('/my-shop/');

  const handleReset = () => {
    setSelectedCategory('All');
    setSelectedCondition('All');
    setSelectedYear('Any');
    setPriceRange(100);
  };

  if (shouldHideHeader) {
    return null;
  }

  return (
    <>
      {/* Fixed Teal Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#13BDC4] text-white pt-3 pb-3 px-3.5 z-40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0 border border-white/30">
              <User className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-medium tracking-wider text-white/80 uppercase">
                WELCOME BACK
              </span>
              <div className="text-xs sm:text-sm font-bold leading-tight truncate max-w-[150px] sm:max-w-[220px]">
                {loading ? 'Loading...' : displayName}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative w-8 h-8 md:w-9 md:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Bell className="w-4 h-4 text-white" />
              {unreadOffersCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#13BDC4]">
                  {unreadOffersCount}
                </span>
              )}
            </Link>

            <Link
              href="/favorites"
              aria-label="Favorites"
              className="w-8 h-8 md:w-9 md:h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <Heart className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        <div className="relative flex items-center max-w-2xl mx-auto">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Search machines, brands, category..."
            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl py-2.5 pl-9 pr-11 focus:outline-none shadow-inner font-medium"
          />

          <button
            onClick={() => setIsFilterOpen(true)}
            aria-label="Filter"
            className="absolute right-1 w-8 h-8 md:w-8.5 md:h-8.5 bg-[#eef7f8] hover:bg-[#d8eff1] rounded-lg flex items-center justify-center text-[#13BDC4] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QuickFilterChips - Normal (scrolls with content) - ONLY ON HOME PAGE */}
      {pathname === '/' && (
        <div className="lg:hidden bg-[#f8fafc] py-2.5 px-3 mt-[110px]">
          <div className="flex items-center space-x-2 overflow-x-auto max-w-2xl mx-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_FILTERS.map((item) => {
              const isActive = activeQuickFilter === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveQuickFilter(item)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#13BDC4] text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-50 flex flex-col lg:hidden touch-none">
          <div className="bg-[#13BDC4] text-white px-4 py-3.5 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <div className="text-base font-semibold">Filter</div>
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-medium text-white/90 hover:text-white underline underline-offset-2"
            >
              Reset
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6 text-slate-700 touch-pan-y">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                <span className="text-slate-800">Price Range (USD)</span>
              </div>
              <div className="flex justify-between text-xs text-[#13BDC4] font-bold mb-1">
                <span>$0K</span>
                <span>${priceRange}K</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-[#13BDC4] h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-800 mb-2.5">Condition</h4>
              <div className="flex flex-wrap gap-2">
                {['All', 'New', 'Used', 'Refurbished'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setSelectedCondition(item)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCondition === item
                        ? 'bg-[#13BDC4] text-white border-[#13BDC4]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2.5">Category</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-[#13BDC4] text-white border-[#13BDC4]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#13BDC4] text-white border-[#13BDC4]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-800 mb-2.5">Year (From)</h4>
              <div className="flex flex-wrap gap-2">
                {['Any', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedYear === year
                        ? 'bg-[#13BDC4] text-white border-[#13BDC4]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full bg-[#13BDC4] hover:bg-[#0fa8ae] text-white py-3 rounded-full text-sm font-semibold shadow-md active:scale-[0.99] transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  );
}