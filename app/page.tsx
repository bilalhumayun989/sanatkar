'use client';

import Navbar from './components/Navbar';
import { useState, useEffect } from 'react';
import Footer from './components/Footer';
import PartCard from './components/PartCard';
import { Part as PartType } from './data/mockData';
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
import { createClient } from '@/lib/supabase/client';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';

const PART_IMG = 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg';
const FALLBACK_CATEGORY_OPTIONS = FIXED_CATEGORY_OPTIONS.map((option) => ({ id: option.value, name: option.label, slug: option.value }));

export default function Home() {
  const { t } = useLanguage();

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [featuredParts, setFeaturedParts] = useState<PartType[]>([]);
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      try {
        // Get supabase session to send auth headers
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch('/api/listings', { 
          cache: 'no-store',
          headers
        });
        if (!res.ok) throw new Error(`Listings API unavailable: HTTP ${res.status}`);

        const payload = await res.json();
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const mappedParts = list.slice(0, 9).map((item: any) => ({
          id: item.id,
          brand: item.brand || item.make || 'Unknown',
          partName: item.title || `${item.make || ''} ${item.model || ''}`.trim() || 'Listing',
          price: Number(item.price) || 0,
          location: item.location || item.city || 'Pakistan',
          image: Array.isArray(item.image_urls) && item.image_urls[0]
            ? item.image_urls[0]
            : '/hero.jpg',
          compatibility: item.mileage || 'Universal',
          condition: item.condition || 'New',
          stockStatus: 'In Stock',
          isFeatured: item.status === 'active',
          sellerRole: null,
          sellerId: null,
          sellerName: null,
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
    };

    loadListings();
    loadBrands();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const supabase = createClient();
        const { data: listingsData, error } = await supabase
          .from('listings')
          .select('category, image_urls, created_at, status')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(listingsData)) {
          const grouped = new Map<string, any>();
          listingsData.forEach((listing: any) => {
            const normalizedCategory = normalizeCategoryValue(listing.category);
            if (!grouped.has(normalizedCategory)) {
              grouped.set(normalizedCategory, {
                id: normalizedCategory,
                name: FALLBACK_CATEGORY_OPTIONS.find((item) => item.slug === normalizedCategory)?.name || normalizedCategory,
                slug: normalizedCategory,
                image_url: Array.isArray(listing.image_urls) && listing.image_urls[0] ? listing.image_urls[0] : PART_IMG,
                listing_count: 0,
              });
            }
            const current = grouped.get(normalizedCategory);
            current.listing_count = (current.listing_count || 0) + 1;
          });

          const mapped = FALLBACK_CATEGORY_OPTIONS.map((item) => {
            const existing = grouped.get(item.slug);
            return existing || {
              id: item.slug,
              name: item.name,
              slug: item.slug,
              image_url: PART_IMG,
              listing_count: 0,
            };
          });

          setCategories(mapped);
          return;
        }
      } catch {
        // ignore and fall back to static options
      }

      setCategories(FALLBACK_CATEGORY_OPTIONS.map((item) => ({ ...item, image_url: PART_IMG, listing_count: 0 })));
    };

    loadCategories();
  }, []);

  return (

    <>
      <div className="min-h-screen flex flex-col bg-[#F3F4F6] p-0">
        <main className="flex-grow">
          <div className="relative w-full h-[100vh] min-h-[600px] rounded-[0px] overflow-hidden">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative w-full h-full flex items-end ">
              <div className="absolute inset-0 z-0">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/50 via-black/10 to-black/5"></div>

                <img
                  src="/hero.jpg"
                  alt="Industrial parts"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-20">
                <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="max-w-2xl text-left">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 sm:mb-6 text-white shadow-[0_8px_32px_rgba(255,255,255,0.08)]">
                      {t('verified_industrial_parts')}
                    </span>
                    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-black text-white leading-[0.95] tracking-[-0.03em] mb-6 sm:mb-8">
                      {t('hero_title_1')} <br className="hidden md:block" /> {t('hero_title_2')}
                    </div>
                    <p className="text-white/90 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 leading-relaxed max-w-xl font-medium">
                      {t('hero_desc')}
                    </p>

                    <div className="w-full max-w-3xl rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-3 sm:p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)]">
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
                          <input
                            type="text"
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            placeholder="Search part name or category"
                            className="w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-3.5 text-sm font-semibold text-white placeholder:text-white/60 outline-none transition focus:border-white/50 focus:bg-black/30"
                          />
                        </div>
                        <Link
                          href={brandSearch ? `/buyer?search=${encodeURIComponent(brandSearch)}` : '/buyer'}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                        >
                          <span>{t('show_parts')}</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Categories */}
          <section className="container-wide py-10 md:py-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
              <div className="max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg mb-4">
                  Shop by Category
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  Categories
                </h2>
                <p className="mt-3 md:mt-4 text-sm sm:text-base text-gray-500">
                  Browse curated collections and discover the parts and machines that matter most to your workflow.
                </p>
              </div>

              <Link
                href="/buyer"
                className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
              >
                View Marketplace
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/buyer?category=${encodeURIComponent(category.slug)}`}
                    className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white transition hover:-translate-y-1"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={category.image_url || PART_IMG}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    </div>

                    <div className="p-5">
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        Category
                      </div>
                      <h3 className="mt-2 text-xl font-black tracking-tight text-black">
                        {category.name}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-gray-600">
                        {(category.listing_count ?? 0).toLocaleString()} listings
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm font-semibold text-gray-500">
                  No categories available yet.
                </div>
              )}
            </div>
          </section>

          {/* Shop by Brand */}
          {brands.length > 0 && (
            <section className="container-wide py-10 md:py-16">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
                <div className="max-w-3xl">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg mb-4">
                    Shop by Brand
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                    Trusted Brands
                  </h2>
                  <p className="mt-3 md:mt-4 text-sm sm:text-base text-gray-500">
                    Discover quality parts from industry-leading manufacturers and trusted suppliers.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4" style={{ minWidth: 'fit-content' }}>
                  {brands.map((brand) => {
                    // Generate fallback initials and color
                    const initials = brand.name
                      .split(' ')
                      .map((word: string) => word.charAt(0))
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                    
                    const colors = [
                      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 
                      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
                    ];
                    const colorIndex = brand.name.charCodeAt(0) % colors.length;
                    const fallbackColor = colors[colorIndex];

                    return (
                      <Link
                        key={brand.id}
                        href={`/buyer?brand=${encodeURIComponent(brand.name)}`}
                        className="group flex-shrink-0 w-32 sm:w-36"
                      >
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                          <div className="aspect-square mb-3 flex items-center justify-center rounded-xl overflow-hidden bg-gray-50">
                            {brand.logo_url ? (
                              <img
                                src={brand.logo_url}
                                alt={brand.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full ${fallbackColor} text-white font-bold text-lg flex items-center justify-center ${brand.logo_url ? 'hidden' : 'flex'}`}
                              style={{ display: brand.logo_url ? 'none' : 'flex' }}
                            >
                              {initials}
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-black text-center group-hover:text-primary transition-colors">
                            {brand.name}
                          </h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}



       





          {/* Stats strip */}
          <section className="relative overflow-hidden py-12 md:py-20">
            <div className="container-wide relative z-10">

              {/* Heading */}
              <div className="mb-10 md:mb-14 max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-lg">
                  Platform Statistics
                </span>

                <h2 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  Trusted by the Industrial Community
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-500">
                  Thousands of buyers and sellers trust SanatHub to find genuine
                  industrial machinery and spare parts across Pakistan.
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
      <Footer />

    </>
  );
}