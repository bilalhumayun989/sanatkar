'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import { Part as PartType } from '@/lib/database/mockData';
import { Search, SlidersHorizontal, Check, Loader2, X, Package } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { FIXED_CATEGORY_OPTIONS, normalizeCategoryValue } from '@/lib/categoryConstants';

export default function BuyerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <BuyerPageContent />
        </Suspense>
    );
}

function BuyerPageContent() {
    const { t, language } = useLanguage();
    const { isAdmin } = useAuth();
    const searchParams = useSearchParams();
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    const urlBrand = searchParams.get('brand');
    const [parts, setParts] = useState<PartType[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [adConfig, setAdConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('most_recent');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory || null);

    const priceRanges = [
        { id: 'under_5k', label: 'Under 5,000', min: 0, max: 5000 },
        { id: '5k_15k', label: '5,000 - 15,000', min: 5000, max: 15000 },
        { id: '15k_50k', label: '15,000 - 50,000', min: 15000, max: 50000 },
        { id: '50k_plus', label: '50,000+', min: 50000, max: Infinity },
    ];

    useEffect(() => {
        const fetchParts = async () => {
            try {
                // Call Supabase directly instead of going through internal API to avoid deadlock
                const { createClient } = await import('@/lib/auth/supabase/client');
                const supabase = createClient();

                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Failed to fetch listings:', error);
                    setParts([]);
                    return;
                }

                const list = Array.isArray(data) ? data : [];
                setParts(list.map((item: any) => ({
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
                    sellerRole: item.sellerRole || undefined,
                    sellerId: item.sellerId || undefined,
                    sellerName: item.sellerName || undefined,
                    category: item.category || 'General',
                    createdAt: item.created_at || new Date().toISOString()
                })));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchBrands = async () => {
            try {
                const { createClient } = await import('@/lib/auth/supabase/client');
                const supabase = createClient();
                const { data: brandsData, error } = await supabase
                    .from('brands')
                    .select('id, name')
                    .eq('is_active', true)
                    .order('name');

                if (!error && Array.isArray(brandsData)) {
                    setBrands(brandsData);
                } else {
                    // Fallback to static brands if table doesn't exist or is empty
                    setBrands([
                        { id: '1', name: 'Tajima' },
                        { id: '2', name: 'Barudan' },
                        { id: '3', name: 'Janome' },
                        { id: '4', name: 'Groz-Beckert' },
                        { id: '5', name: 'Brother' }
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch brands:', err);
                // Fallback to static brands
                setBrands([
                    { id: '1', name: 'Tajima' },
                    { id: '2', name: 'Barudan' },
                    { id: '3', name: 'Janome' },
                    { id: '4', name: 'Groz-Beckert' },
                    { id: '5', name: 'Brother' }
                ]);
            }
        };

        const fetchAd = async () => {
            try {
                // Add timeout to prevent hanging on slow external requests
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const res = await fetch('/api/ad', {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.ad) setAdConfig(data.ad);
                }
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') {
                    console.warn('Ad fetch timed out');
                } else {
                    console.error('ad fetch error', e);
                }
            }
        };

        fetchParts();
        fetchBrands();
        fetchAd();
    }, []);

    useEffect(() => {
        if (urlSearch) setSearchQuery(urlSearch);
        if (urlCategory) setSelectedCategory(urlCategory);
        if (urlBrand) setSelectedBrandFilter(urlBrand);
    }, [urlSearch, urlCategory, urlBrand]);

    useEffect(() => {
        document.body.style.overflow = showMobileFilters ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showMobileFilters]);

    const filteredParts = useMemo(() => {
        let result = [...parts];
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => p.partName.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
        }
        const activeCategory = selectedCategory || urlCategory;
        if (activeCategory) {
            const categoryFilter = normalizeCategoryValue(activeCategory);
            result = result.filter(p => normalizeCategoryValue(p.category).toLowerCase() === categoryFilter);
        }
        // Brand filtering from URL or dropdown
        const activeBrand = selectedBrandFilter || urlBrand;
        if (activeBrand) {
            result = result.filter(p => p.brand.toLowerCase() === activeBrand.toLowerCase());
        }
        // Checkbox brand filtering (from sidebar)
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brand));
        }
        if (selectedPriceRanges.length > 0) {
            result = result.filter(p => selectedPriceRanges.some(id => {
                const r = priceRanges.find(r => r.id === id);
                return r ? p.price >= r.min && p.price < r.max : false;
            }));
        }
        switch (sortBy) {
            case 'price_low_high': result.sort((a, b) => a.price - b.price); break;
            case 'price_high_low': result.sort((a, b) => b.price - a.price); break;
            default: result.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        }
        return result;
    }, [parts, searchQuery, selectedBrands, selectedPriceRanges, sortBy, selectedCategory, urlCategory, selectedBrandFilter, urlBrand]);

    const handleBrandToggle = (brand: string) =>
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    const handlePriceToggle = (id: string) =>
        setSelectedPriceRanges(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedBrands([]);
        setSelectedPriceRanges([]);
        setSortBy('most_recent');
        setSelectedCategory(null);
        setSelectedBrandFilter('');
    };
    const activeFilterCount = selectedBrands.length + selectedPriceRanges.length + ((selectedCategory || urlCategory) ? 1 : 0) + ((selectedBrandFilter || urlBrand) ? 1 : 0);

    const FilterSection = () => (
        <div className="space-y-10">
            <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('price_range')}</h4>
                <div className="space-y-3">
                    {priceRanges.map((range) => (
                        <label key={range.id} className="flex items-center group cursor-pointer">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={selectedPriceRanges.includes(range.id)} onChange={() => handlePriceToggle(range.id)}
                                    className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                                <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"><Check size={14} strokeWidth={4} /></div>
                            </div>
                            <span className="ml-3 text-sm font-bold text-black/70 group-hover:text-black transition-colors">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('brand')}</h4>
                <div className="space-y-3">
                    {brands.map((brand) => (
                        <label key={brand.id} className="flex items-center group cursor-pointer">
                            <div className="relative flex items-center justify-center">
                                <input type="checkbox" checked={selectedBrands.includes(brand.name)} onChange={() => handleBrandToggle(brand.name)}
                                    className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                                <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"><Check size={14} strokeWidth={4} /></div>
                            </div>
                            <span className="ml-3 text-sm font-bold text-black/70 group-hover:text-black transition-colors">{brand.name}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-white text-black">
            <Navbar />

            {/* Mobile Filter Drawer */}
            <div className={`fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${showMobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowMobileFilters(false)} />
            <div className={`fixed top-0 right-0 h-full w-[85%] max-w-sm z-[210] bg-white flex flex-col lg:hidden transition-transform duration-300 ease-out shadow-2xl ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="text-xl font-black">{t('filters')}</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6"><FilterSection /></div>
                <div className="px-6 py-5 border-t border-gray-100 flex flex-col gap-3">
                    <button onClick={resetFilters} className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600">{t('reset')}</button>
                    <button onClick={() => setShowMobileFilters(false)} className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-primary-dark active:scale-95">{t('apply_filters')}</button>
                </div>
            </div>

            {/* Search Hero — original desktop layout restored */}
            <section className="bg-black py-26 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg')] bg-cover bg-center opacity-60 " />
                <div className="container-wide relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-black !text-white mb-6 leading-tight">
                            {language === 'en' ? (
                                <>Find Your Perfect <span className="text-white/50">Part</span></>
                            ) : (
                                <>اپنے مطلوبہ <span className="text-white/50">پرزے</span> تلاش کریں</>
                            )}
                        </h1>
                        <div className="relative group w-full">
                            {/* Left Search Icon with High Visibility & Z-Index */}
                            <div className="absolute inset-y-0 left-5 z-10 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0092b8] transition-colors">
                                <Search size={22} className="stroke-[2.5]" />
                            </div>

                            {/* Search Input Field */}
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 md:pr-40 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0092b8]/40 focus:border-[#0092b8] transition-all text-sm md:text-base shadow-sm"
                            />

                            {/* Search Action Button */}
                            <button
                                type="button"
                                className="hidden md:flex absolute right-2.5 top-2.5 bottom-2.5 z-10 items-center justify-center bg-[#0092b8] hover:bg-[#007a9b] text-white px-7 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                            >
                                {t('search')}
                            </button>
                        </div>
                        {/* Mobile search button */}
                        <button className="md:hidden mt-3 w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all active:scale-95">
                            {t('search')}
                        </button>

                    </div>
                </div>
            </section>

            {/* Main Layout */}
            <div className="py-12 px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-10">

                  {/* Desktop Sidebar */}
<aside className="hidden lg:block w-72 flex-shrink-0">
  <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-4 shadow-sm">
    
    {/* Header */}
    <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-100">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
        {t('filters')} 
        <SlidersHorizontal size={16} className="text-[#0092b8]" />
        {activeFilterCount > 0 && (
          <span className="bg-[#0092b8] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 shadow-sm">
            {activeFilterCount}
          </span>
        )}
      </h3>
      <button 
        onClick={resetFilters} 
        className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
      >
        {t('reset')}
      </button>
    </div>

    {/* Filter Options */}
    <FilterSection />

    {/* Apply Button */}
    <div className="mt-8 pt-6 border-t border-slate-100">
      <button 
        onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
        className="w-full bg-[#0092b8] hover:bg-[#007a9b] text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-[#0092b8]/20"
      >
        {t('apply_filters')}
      </button>
    </div>

  </div>
</aside>

                    {/* Parts Grid */}
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-6">
                            <button onClick={() => setSelectedCategory(null)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${!selectedCategory ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600'}`}>
                                All categories
                            </button>
                           
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-black">
                                        {t('results')} <span className="text-gray-400">({filteredParts.length})</span>
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium">{t('verified_parts_desc')}</p>
                                </div>
                                {/* Mobile filter button */}
                                <button onClick={() => setShowMobileFilters(true)}
                                    className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl font-bold text-sm active:scale-95 transition-all relative shrink-0">
                                    <SlidersHorizontal size={16} /> {t('filters')}
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                                {/* Brand filter dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedBrandFilter || urlBrand || ''}
                                        onChange={(e) => setSelectedBrandFilter(e.target.value)}
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-9 min-w-[120px]"
                                    >
                                        <option value="">All Brands</option>
                                        {brands.map((brand) => (
                                            <option key={brand.id} value={brand.name}>{brand.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-gray-400 uppercase tracking-wider whitespace-nowrap hidden sm:block">{t('sort_by')}</span>
                                <div className="relative">
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-9">
                                        <option value="most_recent">{t('most_recent')}</option>
                                        <option value="price_low_high">{t('price_low_high')}</option>
                                        <option value="price_high_low">{t('price_high_low')}</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active filter chips */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {selectedBrands.map(b => (
                                    <button key={b} onClick={() => handleBrandToggle(b)}
                                        className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                                        {b} <X size={11} />
                                    </button>
                                ))}
                                {(selectedBrandFilter || urlBrand) && (
                                    <button onClick={() => setSelectedBrandFilter('')} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                                        Brand: {selectedBrandFilter || urlBrand} <X size={11} />
                                    </button>
                                )}
                                {selectedPriceRanges.map(id => {
                                    const r = priceRanges.find(r => r.id === id);
                                    return r ? (
                                        <button key={id} onClick={() => handlePriceToggle(id)}
                                            className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                                            {r.label} <X size={11} />
                                        </button>
                                    ) : null;
                                })}
                                {selectedCategory && (
                                    <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                                        {FIXED_CATEGORY_OPTIONS.find((option) => option.value === selectedCategory)?.label || selectedCategory} <X size={11} />
                                    </button>
                                )}
                                <button onClick={resetFilters} className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1">Clear all</button>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-200">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('loading_parts')}</p>
                            </div>
                        ) : error ? (
                            <div className="bg-gray-50 border border-gray-200 text-black px-10 py-12 rounded-[3rem] text-center">
                                <h3 className="text-xl font-black mb-2">{t('error_occurred')}</h3>
                                <p className="font-medium text-gray-500">{error}</p>
                            </div>
                        ) : filteredParts.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 text-gray-500 px-10 py-12 rounded-[3rem] text-center">
                                <Package size={40} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-black mb-2 text-black">{t('no_parts_found')}</h3>
                                <p className="font-medium">{t('adjust_filters')}</p>
                                <button onClick={resetFilters} className="mt-6 text-primary font-bold hover:underline">{t('reset_all_filters')}</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                                {filteredParts.map((part, idx) => (
                                    <div key={part.id} className="reveal-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <PartCard part={part as any} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Ad banner */}
                        {adConfig && adConfig.isActive !== false && (
                            <div className="my-16">
                                <div className="bg-gray-50 rounded-[2.5rem] p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-200 relative overflow-hidden">
                                    <div className="relative z-10 max-w-md text-center md:text-left">
                                        <span className="inline-block bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-4 tracking-[0.2em]">{adConfig.badgeText || t('promoted_badge')}</span>
                                        <h3 className="text-2xl md:text-3xl font-black text-black mb-4 leading-tight">{adConfig.title || t('ad_title')}</h3>
                                        <p className="text-gray-500 text-sm font-medium mb-6">{adConfig.description || t('ad_desc')}</p>
                                        <Link href={adConfig.buttonLink || '/seller'}>
                                            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary-dark transition-all active:scale-95">
                                                {adConfig.buttonText || t('ad_button')}
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="relative w-full md:w-[320px] lg:w-[400px] aspect-video md:aspect-[16/10] bg-white rounded-3xl overflow-hidden border border-gray-200 transition-transform duration-500 hover:scale-105 shrink-0">
                                        <img src={adConfig.imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'} alt="Ad" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && filteredParts.length > 0 && (
                            <div className="mt-16 flex justify-center">
                                <button className="bg-white border border-gray-200 text-black font-black px-12 py-5 rounded-[2rem] hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95">
                                    {t('load_more_parts')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
