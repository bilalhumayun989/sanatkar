'use client';

import Navbar from './components/layout/Navbar';
import { useState, useEffect } from 'react';
import Footer from './components/layout/Footer';
import PartCard from './components/features/PartCard';
import { Part as PartType } from '../lib/database/mockData';
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  Package,
  Heart,
  CheckCircle2,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { createClient } from '@/lib/auth/supabase/client';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';
import CategoriesSection from './api/categories/Category';
import FeaturedListing from './components/Feature-listing/FeaturedListing';
import TopBrandsMobile from './components/mobile/TopBrandsMobile';
import FeaturedListingsMobile from './components/mobile/FeaturedListingMobile';
import RecentListingsMobile from './components/mobile/RecentListingMobile';
import ShopsSection from './components/mobile/ShopsSection';

const PART_IMG = 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg';
const FALLBACK_CATEGORY_OPTIONS = FIXED_CATEGORY_OPTIONS;

export default function Home() {
  const { t, language } = useLanguage();

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [featuredParts, setFeaturedParts] = useState<PartType[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [shops, setShops] = useState<any[]>([]);

  useEffect(() => {
    const loadListings = async () => {
      try {
        // Call Supabase directly instead of going through internal API to avoid deadlock
        const supabase = createClient();

        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(9);

        if (error) {
          console.error('Failed to fetch listings:', error);
          setFeaturedParts([]);
          return;
        }

        const list = Array.isArray(data) ? data : [];
        const mappedParts = list.map((item: any) => ({
          id: item.id,
          brand: item.brand || item.make || 'Unknown',
          partName: item.title || `${item.make || ''} ${item.model || ''}`.trim() || 'Listing',
          price: Number(item.price) || 0,
          location: item.location || item.city || 'Pakistan',
          image: Array.isArray(item.image_urls) && item.image_urls[0]
            ? item.image_urls[0]
            : '/hero.jpg',
          compatibility: item.mileage || 'Universal',
          description: item.description || null,
          condition: item.condition || 'New',
          stockStatus: 'In Stock',
          isFeatured: item.status === 'active',
          sellerRole: undefined,
          sellerId: undefined,
          sellerName: undefined,
          category: item.category || 'General',
          createdAt: item.created_at || new Date().toISOString(),
        }));

        setFeaturedParts(mappedParts);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        setFeaturedParts([]);
      }
    };

    const loadBrands = async () => {
      try {
        const supabase = createClient();
        const { data: brandsData, error } = await supabase
          .from('brands')
          .select('id, name, logo_url, description')
          .eq('is_active', true)
          .order('name');

        if (!error && Array.isArray(brandsData) && brandsData.length > 0) {
          setBrands(brandsData);
        } else {
          setBrands([]);
        }
      } catch (err) {
        console.error('Failed to fetch brands:', err);
        setBrands([]);
      }

      // Fetch shops for homepage section
      try {
        const supabase2 = createClient();
        const { data: shopsData } = await supabase2
          .from('shops')
          .select('id, seller_id, title, image_urls, verification_status')
          .order('created_at', { ascending: false })
          .limit(8);
        setShops(Array.isArray(shopsData) ? shopsData : []);
      } catch {
        setShops([]);
      }
    };

    loadListings();
    loadBrands();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      // Fetch categories from database via API
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();

        if (result.success && Array.isArray(result.categories) && result.categories.length > 0) {
          console.log('Successfully fetched categories from database:', result.categories);
          setCategories(result.categories);
          return;
        } else {
          console.log('No categories found in database or API error:', result);
        }
      } catch (error) {
        console.error('Failed to fetch categories from API:', error);
      }

      // Fallback to static options if database is empty
      console.log('Using fallback categories');
      setCategories(FALLBACK_CATEGORY_OPTIONS.map((item) => ({
        id: item.value,
        name: item.label,
        slug: item.value,
        image_url: PART_IMG,
        listing_count: 0,
        is_active: true
      })));
    };

    loadCategories();
  }, []);

  return (

    <>
      {/* Mobile UI - Only visible on mobile/tablet */}
      <div className="lg:hidden bg-[#F6FBFC] min-h-auto">
        <TopBrandsMobile />
      </div>
       <div className="lg:hidden bg-[#F6FBFC] min-h-auto">
        <FeaturedListingsMobile />
      </div>
       <div className="lg:hidden bg-[#F6FBFC] min-h-auto">
        <ShopsSection shops={shops} />
      </div>

       <div className="lg:hidden bg-[#F6FBFC] min-h-auto">
        <RecentListingsMobile />
      </div>

      {/* Desktop UI - Only visible on desktop */}
      <div className="hidden lg:block min-h-screen flex flex-col bg-[#F3F4F6] p-0">
        <main className="flex-grow">
          <div className="relative w-full min-h-[100dvh] overflow-x-hidden bg-[#D1D9E6] flex flex-col justify-between">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative w-full flex-1 flex items-center justify-start py-12 sm:py-16 lg:py-20 xl:py-20">

              {/* Background Image Container */}
              <div className="absolute inset-0 z-0">
                <img
                  src="hero3.jfif"
                  alt="Industrial parts"
                  className="w-full h-full object-cover object-center lg:object-right"
                />

                <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-900/40 lg:bg-gradient-to-r lg:from-slate-950/30 lg:via-slate-950/40 lg:to-transparent" />
              </div>

              {/* Main Content Box - Fixed Width & Perfect Left Alignment */}
              <div className="relative z-20 w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-6 xl:px-12 2xl:px-28">
                <div className={`w-full max-w-xl sm:max-w-2xl lg:max-w-2xl xl:max-w-3xl ${language === 'ur' ? 'text-right' : 'text-left'}`}>

                  {/* Badge */}
                  <div className="inline-block mb-4 sm:mb-6">
                    <span className="inline-flex items-center rounded-full border border-white/40 bg-white/30 backdrop-blur-md px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white shadow-sm">
                      {t('verified_industrial_parts')}
                    </span>
                  </div>

                  {/* Heading */}
                  <div className="text-4xl sm:text-6xl md:text-7xl lg:text-[72px] xl:text-[80px] font-black text-white leading-[1.02] tracking-tight mb-5 sm:mb-6 drop-shadow-md">
                    {t('hero_title_1')} <br className="hidden sm:block" /> {t('hero_title_2')}
                  </div>

                  {/* Subtitle */}
                  <p className="text-white/95 text-sm sm:text-base lg:text-lg xl:text-xl mb-8 sm:mb-10 leading-relaxed font-medium drop-shadow-sm max-w-xl">
                    {t('hero_desc')}
                  </p>

                  {/* Search Bar Container */}
                  <div className="w-full max-w-xl sm:max-w-2xl rounded-2xl sm:rounded-3xl border border-white/50 bg-white/20 backdrop-blur-xl p-2.5 sm:p-3 shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                      <div className="flex-1 relative">
                        <Search
                          size={18}
                          className={`absolute ${language === 'ur' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white`}
                        />
                        <input
                          type="text"
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          placeholder="Search part name or category"
                          className={`w-full rounded-xl sm:rounded-2xl border border-white/40 bg-white/10 ${language === 'ur' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-xs sm:text-sm font-medium text-white placeholder:text-white/80 outline-none transition focus:bg-white/20 focus:border-white`}
                        />
                      </div>

                      <Link
                        href={
                          brandSearch
                            ? `/buyer?search=${encodeURIComponent(brandSearch)}`
                            : '/buyer'
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#13BDC4] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:bg-[#0fa6ac] active:scale-[0.98] shadow-md whitespace-nowrap"
                      >
                        <span>{t('show_parts')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </div>


          <CategoriesSection categories={categories} />


        {brands.length > 0 && (
          <section className="container-wide py-10 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg mb-4">
                  {t('shop_by_brand')}
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  {t('top_brands')}
                </h2>
                <p className="mt-3 md:mt-4 text-sm sm:text-base text-gray-500">
                  {t('top_brands_desc')}
                </p>
              </div>

           
            </div>

            {/* Conditional: Grid for ≤8 brands, Slider for >8 brands */}
            {brands.length <= 8 ? (
              // Grid Layout for 8 or fewer brands
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 items-center">
                {brands.map((brand) => {
                  const initials = brand.name
                    .split(' ')
                    .map((word: string) => word.charAt(0))
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <Link
                      key={brand.id}
                      href={`/buyer?brand=${encodeURIComponent(brand.name)}`}
                      className="group flex flex-col items-center justify-center p-4 h-24 bg-white rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    >
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`text-xs font-bold tracking-wider uppercase text-slate-700 ${
                          brand.logo_url ? 'hidden' : 'flex'
                        }`}
                        style={{ display: brand.logo_url ? 'none' : 'flex' }}
                      >
                        {brand.name || initials}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              // Horizontal Auto-Sliding Carousel for 9+ brands
              <div className="relative overflow-hidden">
                <div 
                  className="flex gap-6 animate-slide-rtl"
                  style={{
                    width: `${brands.length * 144}px`, // 144px = w-32 (128px) + gap (16px)
                    animation: `slide-rtl ${brands.length * 3}s linear infinite`
                  }}
                >
                  {/* Double the brands for seamless loop */}
                  {[...brands, ...brands].map((brand, index) => {
                    const initials = brand.name
                      .split(' ')
                      .map((word: string) => word.charAt(0))
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <Link
                        key={`${brand.id}-${index}`}
                        href={`/buyer?brand=${encodeURIComponent(brand.name)}`}
                        className="group flex flex-col items-center justify-center p-0 w-34 h-30 rounded-xl border border-[#0092B8] shrink-0"
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="max-h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all "
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <div
                          className={`text-xs font-bold tracking-wider uppercase text-slate-700 text-center ${
                            brand.logo_url ? 'hidden' : 'flex'
                          }`}
                          style={{ display: brand.logo_url ? 'none' : 'flex' }}
                        >
                          {brand.name || initials}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}





          <FeaturedListing />

          {/* Shop by Brand */}
        {/* Shop by Brand - Full Blue Section */}





          {/* SHOPS SECTION */}
        {/* Trusted Seller Shops */}
{/* {shops.length > 0 && (
  <section className="container-wide py-12 md:py-16 bg-slate-50/50">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#0092b8]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0092b8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#13bdc4] animate-pulse" />
          Verified Stores
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
          Trusted Seller Shops
        </h2>
        <p className="text-sm text-slate-600 max-w-lg mt-1">
          Explore storefronts from verified industrial equipment and machinery suppliers.
        </p>
      </div>

      <Link
        href="/shops"
        className="self-start md:self-auto text-xs font-bold text-[#0092b8] hover:text-[#13bdc4] transition-colors flex items-center gap-1 group"
      >
        Explore All Stores
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </Link>
    </div> */}

    {/* Scrollable Horizontal Layout */}
    {/* <div
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className="overflow-x-auto py-2 -my-2 [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex gap-5 pb-3" style={{ minWidth: 'fit-content' }}>
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/shop/${shop.seller_id}`}
            className="group relative w-64 sm:w-72 flex-shrink-0 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#13bdc4]/40 transition-all duration-300 hover:-translate-y-1"
          > */}
            {/* Banner/Cover Image */}
            {/* <div className="relative h-28 w-full bg-gradient-to-r from-slate-800 to-slate-900 overflow-hidden">
              {shop.image_urls?.[0] ? (
                <img
                  src={shop.image_urls[0]}
                  alt={shop.title}
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0092b8] to-slate-900 text-white/20 font-black text-4xl select-none">
                  STORE
                </div>
              )} */}

              {/* Status Badge */}
              {/* {shop.verification_status === 'verified' && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                  Verified
                </span>
              )}
            </div> */}

            {/* Shop Details */}
            {/* <div className="p-4 pt-3 relative">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-[#0092b8] transition-colors">
                  {shop.title}
                </h3>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-600">Visit Storefront</span>
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#13bdc4] group-hover:text-white transition-colors">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
)} */}

          {/* Stats strip */}
          <section className="relative overflow-hidden py-12 md:py-20">
            <div className="container-wide relative z-10">

              {/* Heading */}
              <div className="mb-10 md:mb-14 max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-lg">
                  {t('platform_statistics')}
                </span>

                <h2 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  {t('trusted_community')}
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-500">
                  {t('trusted_desc')}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {[
                  { label: t("listed_parts"), value: "5,000+", icon: <Package size={24} /> },
                  { label: t("happy_clients"), value: "1,200+", icon: <Heart size={24} /> },
                  { label: t("genuine_products"), value: "50+", icon: <CheckCircle2 size={24} /> },
                  { label: t("active_ads"), value: "18K+", icon: <LayoutGrid size={24} /> },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl p-5 sm:p-6 md:p-7 shadow-[0_15px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
                  >
                    {/* Glow */}
                    <div className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Icon */}
                    <div className="relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                      {stat.icon}
                    </div>

                    {/* Value */}
                    <h3 className="relative z-10 mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black">
                      {stat.value}
                    </h3>

                    {/* Label */}
                    <p className="relative z-10 mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-gray-500 leading-relaxed">
                      {stat.label}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          </section>






          {/* JUST DROPPED — filterable product grid */}
          <section className="container-wide py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 px-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary text-white backdrop-blur-xl px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-700 mb-4">
                  Featured Collection
                </span>

                <h2 className="text-2xl md:text-4xl font-extrabold text-black tracking-tight mb-2">
                  Just Dropped Collections
                </h2>

                <p className="text-sm text-gray-500 max-w-lg">
                  {t('hero_desc')}
                </p>
              </div>

              <div className="flex shrink-0">
                <Link
                  href="/buyer"
                  className="rounded-full border border-primary bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-primary-dark hover:shadow-md"
                >
                  All Categories
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredParts.length > 0 ? (
                featuredParts.map((part) => (
                  <PartCard key={part.id} part={part as any} />
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
                  No featured parts available yet.
                </div>
              )}
            </div>

          </section>









          {/* Why choose us — flat feature cards */}
          <section className="container-wide py-16 md:py-20">
            <div className="max-w-xl mb-12 space-y-3">
              <h2 className="text-2xl md:text-4xl font-extrabold text-black tracking-tight">{t('why_buy_with_sanatkar')}</h2>
              <p className="text-gray-500 text-sm md:text-base">{t('why_buy_desc')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {[
                { title: t('feat_1_title'), desc: t('feat_1_desc'), icon: <Zap size={24} /> },
                { title: t('feat_2_title'), desc: t('feat_2_desc'), icon: <Package size={24} /> },
                { title: t('feat_3_title'), desc: t('feat_3_desc'), icon: <ShieldCheck size={24} /> },
              ].map((feat, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-7">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mb-6">
                    {feat.icon}
                  </div>
                  <h3 className="font-black text-black mb-2 text-lg tracking-tight">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </main>

      </div>
      <div className="hidden lg:block">
        <Footer />
      </div>

    </>
  );
}