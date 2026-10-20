'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Bell, Heart, Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

import PriceSlider, { type PriceRange } from '@/app/components/PriceSlider';

interface UserProfile {
  username: string;
  full_name?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function MobileHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadOffersCount, setUnreadOffersCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Modal & Category States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Category[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCondition, setSelectedCondition] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('Any');
  const [priceRange, setPriceRange] = useState<PriceRange>([0, null]);

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
      try {
        const [profileResponse, categoryResponse, brandResponse] = await Promise.all([
          user ? fetch('/api/profile/me', { cache: 'no-store' }) : Promise.resolve(null),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/brands', { cache: 'no-store' }),
        ]);
        const [profileResult, categoryResult, brandResult] = await Promise.all([
          profileResponse?.json() ?? Promise.resolve(null),
          categoryResponse.json(),
          brandResponse.json(),
        ]);
        if (profileResponse?.ok && profileResult?.success) {
          setProfile({ username: profileResult.profile.username, full_name: profileResult.profile.full_name });
          setUnreadOffersCount(Number(profileResult.profile.offers_count) || 0);
        }
        if (categoryResponse.ok && categoryResult.success) setCategories(categoryResult.categories || []);
        if (brandResponse.ok && brandResult.success) setBrands(brandResult.brands || []);
      } catch (error) {
        console.error('Failed to load mobile header data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const displayName = profile?.username || profile?.full_name || (user ? 'User' : 'Sanat Kaar');
  const hiddenRoutePrefixes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/choose-account-type', '/auth'];
  const shouldHideHeader =
    pathname === '/messages' ||
    pathname.startsWith('/messages/') ||
    pathname === '/chats' ||
    pathname.startsWith('/chats/') ||
    pathname === '/sell' ||
    pathname.startsWith('/sell/') ||
    pathname === '/mobile-profile' ||
    pathname.startsWith('/mobile-profile/') ||
    pathname === '/edit-profile' ||
    pathname.startsWith('/edit-profile/') ||
    pathname === '/my-listings' ||
    pathname.startsWith('/my-listings/') ||
    pathname === '/my-shop' ||
    pathname.startsWith('/my-shop/') ||
    hiddenRoutePrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const handleReset = () => {
    setSelectedCategory('All');
    setSelectedBrand('');
    setSelectedCondition('All');
    setSelectedYear('Any');
    setPriceRange([0, null]);
  };

  const applyFilters = () => {
    const params = new URLSearchParams(pathname === '/buyer' ? window.location.search : '');
    const query = searchQuery.trim();
    if (query) params.set('search', query); else params.delete('search');
    if (selectedCategory !== 'All') params.set('category', selectedCategory); else params.delete('category');
    if (selectedCondition !== 'All') params.set('condition', selectedCondition); else params.delete('condition');
    if (selectedYear !== 'Any') params.set('year', selectedYear); else params.delete('year');
    if (selectedBrand) params.set('brand', selectedBrand); else params.delete('brand');
    params.delete('price');
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0])); else params.delete('minPrice');
    if (priceRange[1] !== null) params.set('maxPrice', String(priceRange[1])); else params.delete('maxPrice');
    setIsFilterOpen(false);
    router.push('/buyer?' + params.toString() + '#products');
  };
  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pathname === '/buyer') {
      window.dispatchEvent(new CustomEvent('marketplace-search', { detail: searchQuery }));
      return;
    }
    applyFilters();
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
            <Link href="/blogs" className="rounded-full bg-white/20 px-3 py-2 text-xs font-bold hover:bg-white/30">Blogs</Link>
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

        <form onSubmit={handleSearch} className="relative flex max-w-2xl items-center mx-auto">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>

          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            type="text"
            placeholder="Search machines, brands, category..."
            className="w-full bg-white text-slate-800 placeholder-slate-400 text-xs rounded-xl py-2.5 pl-9 pr-11 focus:outline-none shadow-inner font-medium"
          />

          <button
            type="button"
            onClick={() => pathname === '/buyer' ? window.dispatchEvent(new Event('marketplace-filters')) : setIsFilterOpen(true)}
            aria-label="Filter"
            className="absolute right-1 w-8 h-8 md:w-8.5 md:h-8.5 bg-[#EAEFF9] hover:bg-[#d8eff1] rounded-lg flex items-center justify-center text-[#13BDC4] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[99999] bg-[#EAEFF9] flex flex-col lg:hidden touch-none">
          <div className="bg-[#13BDC4] text-white px-2 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-0 hover:bg-white/10 rounded-full"
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
            <PriceSlider value={priceRange} onChange={setPriceRange} />
            <label className="block text-xs font-semibold">Brand
              <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-3">
                <option value="">All brands</option>
                {brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
              </select>
            </label>

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
                    onClick={() => setSelectedCategory(cat.name.toLowerCase())}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selectedCategory === cat.name.toLowerCase()
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

          <div className="p-4 bg-[#EAEFF9] shrink-0">
            <button
              onClick={applyFilters}
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
