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
import PriceSlider, { type PriceRange } from '@/app/components/PriceSlider';
import { FIXED_CATEGORY_OPTIONS } from '@/lib/categoryConstants';

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
    const urlPrice = searchParams.get('price');
    const [parts, setParts] = useState<(PartType & { categoryId?: string; year?: number })[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [priceRange, setPriceRange] = useState<PriceRange>([0, null]);
    const [condition, setCondition] = useState('');
    const [year, setYear] = useState('');
    const [brands, setBrands] = useState<any[]>([]);
    const [adConfig, setAdConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState('most_recent');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory || null);

    useEffect(() => {
        const fetchParts = async () => {
            try {
                // Call Supabase directly instead of going through internal API to avoid deadlock
                const { createClient } = await import('@/lib/auth/supabase/client');
                const supabase = createClient();

                const list = [];
                for (let offset = 0; ; offset += 1000) {
                    const { data, error } = await supabase.from('listings').select('*')
                        .eq('status', 'active').order('created_at', { ascending: false }).order('id')
                        .range(offset, offset + 999);
                    if (error) throw error;
                    list.push(...(data || []));
                    if (!data || data.length < 1000) break;
                }
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
                    categoryId: item.category_id,
                    year: Number(item.year) || undefined,
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

        fetch('/api/categories').then(r => r.json()).then(data => { if (data.success) setCategories(data.categories); }).catch(console.error);
        fetchParts();
        fetchBrands();
        fetchAd();
    }, []);

    useEffect(() => {
        setSearchQuery(urlSearch || '');
        setSelectedCategory(urlCategory || null);
        setSelectedBrandFilter(urlBrand || '');
        setSelectedBrands([]);
        const legacy: Record<string, PriceRange> = { under_5k: [0, 5000], '5k_15k': [5000, 15000], '15k_50k': [15000, 50000], '50k_plus': [50000, null] };
        const parse = (value: string | null) => value !== null && value.trim() !== '' && Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : null;
        const min = parse(searchParams.get('minPrice')) ?? legacy[urlPrice || '']?.[0] ?? 0;
        const max = parse(searchParams.get('maxPrice')) ?? legacy[urlPrice || '']?.[1] ?? null;
        setPriceRange([min, max === null ? null : Math.max(min, max)]);
        setCondition(searchParams.get('condition') || '');
        setYear(searchParams.get('year') || '');
    }, [urlSearch, urlCategory, urlBrand, urlPrice, searchParams]);

    useEffect(() => {
        const openFilters = () => setShowMobileFilters(true);
        const search = (event: Event) => {
            setSearchQuery(String((event as CustomEvent).detail || ''));
            document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
        };
        window.addEventListener('marketplace-filters', openFilters);
        window.addEventListener('marketplace-search', search);
        return () => {
            window.removeEventListener('marketplace-filters', openFilters);
            window.removeEventListener('marketplace-search', search);
        };
    }, []);

    const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    useEffect(() => {
        if (window.location.hash === '#products' || urlCategory || urlBrand) {
            const frame = requestAnimationFrame(() => document.getElementById('products')?.scrollIntoView({ block: 'start' }));
            return () => cancelAnimationFrame(frame);
        }
    }, [urlCategory, urlBrand, searchParams]);

    useEffect(() => {
        document.body.style.overflow = showMobileFilters ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showMobileFilters]);

    const filteredParts = useMemo(() => {
        let result = [...parts];
        if (searchQuery) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter(p => p.partName.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
        }
        if (selectedCategory) {
            const selected = categories.find(c => c.id === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase());
            const name = (selected?.name || selectedCategory).trim().toLowerCase();
            result = result.filter(p => p.categoryId === selectedCategory || (selected && p.categoryId === selected.id) || (p.category || '').trim().toLowerCase() === name);
        }
        const brandNames = selectedBrands.length ? selectedBrands : selectedBrandFilter ? [selectedBrandFilter] : [];
        if (brandNames.length) result = result.filter(p => brandNames.some(b => b.toLowerCase() === p.brand.trim().toLowerCase()));
        result = result.filter(p => p.price >= priceRange[0] && (priceRange[1] === null || p.price <= priceRange[1]));
        if (condition) result = result.filter(p => p.condition.toLowerCase() === condition.toLowerCase());
        if (year) result = result.filter(p => p.year && p.year >= Number(year));
        switch (sortBy) {
            case 'price_low_high': result.sort((a, b) => a.price - b.price); break;
            case 'price_high_low': result.sort((a, b) => b.price - a.price); break;
            default: result.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        }
        return result;
    }, [parts, searchQuery, selectedBrands, priceRange, sortBy, selectedCategory, selectedBrandFilter, categories, condition, year]);

    useEffect(() => { setVisibleCount(20); }, [searchQuery, selectedBrands, priceRange, sortBy, selectedCategory, selectedBrandFilter, condition, year]);
    const handleBrandToggle = (brand: string) => {
        setSelectedBrandFilter('');
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    };
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedBrands([]);
        setPriceRange([0, null]);
        setCondition('');
        setYear('');
        setSortBy('most_recent');
        setSelectedCategory(null);
        setSelectedBrandFilter('');
    };
    const activeFilterCount = selectedBrands.length + Number(priceRange[0] > 0 || priceRange[1] !== null) + Number(Boolean(selectedCategory)) + Number(Boolean(selectedBrandFilter)) + Number(Boolean(condition)) + Number(Boolean(year));
    const categoryOptions = Array.from(new Map([
        ...FIXED_CATEGORY_OPTIONS.map(c => ({ id: c.value, name: c.label })), ...categories,
    ].map(c => [c.name.toLowerCase(), c])).values());
    const filterSection = (
        <div className="space-y-10">
            <label className="block text-xs font-bold text-slate-600">Category
                <select aria-label="Category" value={categoryOptions.find(c => c.id === selectedCategory)?.name.toLowerCase() || selectedCategory?.toLowerCase() || ''} onChange={e => setSelectedCategory(e.target.value || null)} className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm">
                    <option value="">All categories</option>
                    {categoryOptions.map(c => <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>)}
                </select>
            </label>
            <PriceSlider value={priceRange} onChange={setPriceRange} ceiling={parts.reduce((max, p) => Math.max(max, p.price), 1000)} />
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
                <div className="flex-1 overflow-y-auto px-6 py-6">{filterSection}</div>
                <div className="px-6 py-5 border-t border-gray-100 flex flex-col gap-3">
                    <button onClick={resetFilters} className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600">{t('reset')}</button>
                    <button onClick={() => { setShowMobileFilters(false); scrollToProducts(); }} className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-primary-dark active:scale-95">{t('apply_filters')}</button>
                </div>
            </div>

            {/* Marketplace search hero */}
            <section className="relative overflow-hidden bg-[#12343a] pt-16 text-white">
                <div className="mx-auto grid min-h-[390px] max-w-[1500px] lg:grid-cols-[1.05fr_.95fr]">
                    <div className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16">
                        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#65dce0]/30 bg-[#65dce0]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#9af3f0]">
                            <Package size={14} /> Industrial marketplace
                        </div>
                        <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                            {language === 'en' ? <>Find Your Perfect <span className="text-[#73e3e2]">Part</span></> : <>اپنے مطلوبہ <span className="text-[#73e3e2]">پرزے</span> تلاش کریں</>}
                        </h1>
                        <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Search genuine machine parts, compare trusted sellers, and find the right fit for your work.</p>
                        <div className="group relative mt-7 max-w-2xl">
                            <div className="absolute inset-y-0 left-4 z-10 flex items-center text-slate-400 transition-colors group-focus-within:text-[#079bb5] pointer-events-none"><Search size={21} /></div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') scrollToProducts(); }}
                                placeholder={t('search_placeholder')}
                                className="w-full rounded-2xl border border-white/10 bg-white py-4 pl-12 pr-32 text-sm text-slate-800 shadow-2xl outline-none placeholder:text-slate-400 focus:border-[#73e3e2] focus:ring-4 focus:ring-[#73e3e2]/20 sm:text-base"
                            />
                            <button type="button" onClick={scrollToProducts} className="absolute right-2 top-2 bottom-2 hidden rounded-xl bg-[#079bb5] px-6 text-sm font-black text-white transition hover:bg-[#087c91] active:scale-95 sm:block">{t('search')}</button>
                        </div>
                        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/60">
                            <span className="font-bold text-white/80">{t('popular')}</span>
                            {['Bearings', 'Belts', 'Needles'].map((item) => <button key={item} type="button" onClick={() => setSearchQuery(item)} className="rounded-full border border-white/15 px-3 py-1.5 transition hover:border-[#73e3e2] hover:text-white">{item}</button>)}
                        </div>
                    </div>
                    <div className="relative hidden min-h-[390px] overflow-hidden lg:block">
                        <img src="/hero2.jfif" alt="Industrial machine parts" className="h-full w-full object-cover object-center" />
                        <div className="absolute inset-y-0 left-0 w-32 bg-[#12343a] [clip-path:polygon(0_0,100%_0,0_100%)]" />
                        <div className="absolute bottom-7 right-8 rounded-2xl border border-white/20 bg-[#12343a]/90 px-4 py-3 shadow-xl backdrop-blur-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#9af3f0]">Built for industry</p>
                            <p className="mt-1 text-xs font-semibold text-white/80">Parts that keep work moving</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Layout */}
            <div id="products" className="scroll-mt-32 lg:scroll-mt-20 py-12 px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Desktop Sidebar */}
                    <aside className="hidden w-72 flex-shrink-0 self-stretch lg:block">
                        <div className="sticky top-4 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" style={{ height: 'calc(100vh - 2rem)' }}>

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
                            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                                {filterSection}
                            </div>

                            {/* Apply Button */}
                            <div className="mt-auto shrink-0 border-t border-slate-100 pt-6">
                                <button
                                    onClick={scrollToProducts}
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
                                        value={selectedBrandFilter}
                                        onChange={(e) => { setSelectedBrandFilter(e.target.value); setSelectedBrands([]); }}
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
                                {selectedBrandFilter && (
                                    <button onClick={() => setSelectedBrandFilter('')} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                                        Brand: {selectedBrandFilter} <X size={11} />
                                    </button>
                                )}
                                {(priceRange[0] > 0 || priceRange[1] !== null) && <button onClick={() => setPriceRange([0, null])} className="text-xs font-bold text-primary">PKR {priceRange[0].toLocaleString()} ? {priceRange[1]?.toLocaleString() ?? 'Any'} ?</button>}
                                {condition && <button onClick={() => setCondition('')} className="text-xs font-bold text-primary">{condition} ?</button>}
                                {year && <button onClick={() => setYear('')} className="text-xs font-bold text-primary">From {year} ?</button>}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                {filteredParts.slice(0, visibleCount).map((part, idx) => (
                                    <div key={part.id} className="reveal-up" style={{ animationDelay: `${(idx % 20) * 0.05}s` }}>
                                        <PartCard part={part as any} compact />
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

                        {!loading && !error && filteredParts.length > visibleCount && (
                            <div className="mt-16 flex justify-center">
                                <button onClick={() => setVisibleCount(count => count + 20)} className="bg-white border border-gray-200 text-black font-black px-12 py-5 rounded-[2rem] hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 active:scale-95">
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
