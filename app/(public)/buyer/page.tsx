'use client';

import { refreshOnRealtime } from '@/lib/realtime/client';

import { Fragment, Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import ProductAdSlot from '@/app/components/ads/ProductAdSlot';
import { Part as PartType } from '@/lib/database/mockData';
import { Search, SlidersHorizontal, Check, Loader2, X, Package, LayoutGrid, List, Heart, MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import PriceSlider, { type PriceRange } from '@/app/components/PriceSlider';
import { FIXED_CATEGORY_OPTIONS } from '@/lib/categoryConstants';

// Switch off to hide the reserved ad banners without leaving gaps.
const SHOW_PRODUCT_ADS = false;
const PRODUCTS_PER_AD = 8;

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
    const urlFeatured = searchParams.get('featured');
    const urlPrice = searchParams.get('price');
    const [parts, setParts] = useState<(PartType & { categoryId?: string; year?: number })[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string; is_popular?: boolean; is_active?: boolean }[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 20;
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
    const [featuredOnly, setFeaturedOnly] = useState(urlFeatured === 'true');
    const [sortBy, setSortBy] = useState('most_recent');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const filterSidebarRef = useRef<HTMLElement | null>(null);
    const filterPanelRef = useRef<HTMLDivElement | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory || null);
    const configuredAdHref = typeof adConfig?.buttonLink === 'string' ? adConfig.buttonLink.trim() : '';
    const adButtonHref = configuredAdHref.startsWith('/') && !configuredAdHref.startsWith('//') && configuredAdHref !== '/#'
        ? configuredAdHref
        : '/seller';

    useEffect(() => {
        const fetchParts = async () => {
                try {
                    const response = await fetch('/api/listings?limit=100', { cache: 'no-store' });
                    const result = await response.json();
                    if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.message || 'Unable to load listings.');
                    setParts(result.data.map((item: any) => ({
                        id: item.id,
                        brand: item.brand || item.make || 'Unknown',
                        partName: item.title || `${item.make || ''} ${item.model || ''}`.trim() || 'Listing',
                        price: Number(item.price) || 0,
                        location: item.location || item.city || 'Pakistan',
                        image: Array.isArray(item.image_urls) && item.image_urls[0] ? item.image_urls[0] : '/hero.jpg',
                        compatibility: item.mileage || 'Universal',
                        condition: item.condition || 'New',
                        stockStatus: 'In Stock',
                        isFeatured: Boolean(item.is_featured),
                        sellerRole: item.seller?.role || undefined,
                        sellerId: item.seller_id || item.seller?.id || undefined,
                        sellerName: item.seller?.full_name || item.seller?.username || undefined,
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
                    const response = await fetch('/api/brands', { cache: 'no-store' });
                    const result = await response.json();
                    if (response.ok && result.success && Array.isArray(result.brands)) {
                        setBrands(result.brands);
                    } else {
                        setBrands([]);
                    }
                } catch (err) {
                    console.error('Failed to fetch brands:', err);
                    setBrands([]);
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

        const stopListings = refreshOnRealtime(['listings'], fetchParts);
        const stopCatalog = refreshOnRealtime(['catalog'], async () => { await fetchBrands(); await fetchAd(); });
        fetchParts();
        fetchBrands();
        fetchAd();
        return () => { stopListings(); stopCatalog(); };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let inFlight = false;
        const loadCategories = async () => {
            if (inFlight || document.visibilityState !== 'visible') return;
            inFlight = true;
            try {
                const response = await fetch('/api/categories', { cache: 'no-store', signal: controller.signal });
                if (!response.ok) return;
                const result = await response.json();
                if (!controller.signal.aborted && result.success && Array.isArray(result.categories)) setCategories(result.categories);
            } catch { /* Keep the last category list if a refresh fails. */ }
            finally { inFlight = false; }
        };
        void loadCategories();
        const refresh = () => { void loadCategories(); };
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        const unsubscribe = refreshOnRealtime(['catalog'], loadCategories);
        return () => {
            controller.abort();
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        setSearchQuery(urlSearch || '');
        setSelectedCategory(urlCategory || null);
        setSelectedBrandFilter(urlBrand || '');
        setFeaturedOnly(urlFeatured === 'true');
        setSelectedBrands([]);
        const legacy: Record<string, PriceRange> = { under_5k: [0, 5000], '5k_15k': [5000, 15000], '15k_50k': [15000, 50000], '50k_plus': [50000, null] };
        const parse = (value: string | null) => value !== null && value.trim() !== '' && Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : null;
        const min = parse(searchParams.get('minPrice')) ?? legacy[urlPrice || '']?.[0] ?? 0;
        const max = parse(searchParams.get('maxPrice')) ?? legacy[urlPrice || '']?.[1] ?? null;
        setPriceRange([min, max === null ? null : Math.max(min, max)]);
        setCondition(searchParams.get('condition') || '');
        setYear(searchParams.get('year') || '');
    }, [urlSearch, urlCategory, urlBrand, urlPrice, urlFeatured, searchParams]);

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

    useEffect(() => {
        const sidebar = filterSidebarRef.current;
        const panel = filterPanelRef.current;
        const productsSection = document.getElementById('products');
        const heroSection = productsSection?.previousElementSibling;
        if (!sidebar || !panel || !productsSection) return;

        const top = 80;
        let frame = 0;
        let isPinned = false;
        let sidebarTop = 0;
        let sidebarLeft = 0;
        let sidebarWidth = 0;
        let productsBottom = 0;

        const measureLayout = () => {
            const sidebarRect = sidebar.getBoundingClientRect();
            sidebarTop = sidebarRect.top + window.scrollY;
            sidebarLeft = sidebarRect.left;
            sidebarWidth = sidebarRect.width;
            const productsGrid = productsSection.querySelector<HTMLElement>('[data-products-grid]');
            productsBottom = (productsGrid || productsSection).getBoundingClientRect().bottom + window.scrollY;
        };

        const pinPanel = () => {
            panel.style.position = 'fixed';
            panel.style.top = `${top}px`;
            panel.style.left = `${sidebarLeft}px`;
            panel.style.width = `${sidebarWidth}px`;
            panel.style.height = 'calc(100vh - 6rem)';
            panel.style.transform = 'translate3d(0, 0, 0)';
            panel.style.zIndex = '40';
        };

        const resetPanelPosition = () => {
            panel.style.position = '';
            panel.style.top = '';
            panel.style.left = '';
            panel.style.width = '';
            panel.style.height = '';
            panel.style.transform = '';
            panel.style.zIndex = '';
        };

        const updatePinnedFilter = () => {
            if (frame) return;
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                if (window.innerWidth < 1024) {
                    isPinned = false;
                    resetPanelPosition();
                    return;
                }

                const scrollTop = window.scrollY + top;
                const startThreshold = isPinned ? sidebarTop - 2 : sidebarTop + 2;
                const stillInProducts = window.scrollY < productsBottom - 2;
                const shouldPin = scrollTop >= startThreshold && stillInProducts;

                if (shouldPin !== isPinned) {
                    isPinned = shouldPin;
                    if (isPinned) pinPanel();
                    else resetPanelPosition();
                }

                if (isPinned) {
                    const bottomAlignedTop = productsBottom - window.scrollY - panel.offsetHeight;
                    const translateY = Math.min(0, bottomAlignedTop - top);
                    const transform = `translate3d(0, ${translateY}px, 0)`;
                    if (panel.style.transform !== transform) panel.style.transform = transform;
                }
            });
        };

        const handleResize = () => {
            measureLayout();
            if (window.innerWidth < 1024) {
                isPinned = false;
                resetPanelPosition();
            } else if (isPinned) pinPanel();
            updatePinnedFilter();
        };

        const handleLayoutChange = () => {
            measureLayout();
            updatePinnedFilter();
        };

        measureLayout();
        updatePinnedFilter();
        window.addEventListener('scroll', updatePinnedFilter, { passive: true });
        window.addEventListener('resize', handleResize);
        const resizeObserver = typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(handleLayoutChange);
        resizeObserver?.observe(sidebar);
        resizeObserver?.observe(productsSection);
        const productsGrid = productsSection.querySelector<HTMLElement>('[data-products-grid]');
        if (productsGrid) resizeObserver?.observe(productsGrid);
        if (heroSection instanceof HTMLElement) resizeObserver?.observe(heroSection);
        return () => {
            window.removeEventListener('scroll', updatePinnedFilter);
            window.removeEventListener('resize', handleResize);
            resizeObserver?.disconnect();
            if (frame) window.cancelAnimationFrame(frame);
            resetPanelPosition();
        };
    }, []);

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
        if (featuredOnly) result = result.filter(p => p.isFeatured);
        switch (sortBy) {
            case 'price_low_high': result.sort((a, b) => a.price - b.price); break;
            case 'price_high_low': result.sort((a, b) => b.price - a.price); break;
            default: result.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        }
        return result;
    }, [parts, searchQuery, selectedBrands, priceRange, sortBy, selectedCategory, selectedBrandFilter, categories, condition, year, featuredOnly]);

    const pageCount = Math.max(1, Math.ceil(filteredParts.length / productsPerPage));
    const pageParts = filteredParts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
    const goToPage = (page: number) => {
        setCurrentPage(page);
        requestAnimationFrame(() => document.querySelector('[data-products-grid]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedBrands, priceRange, sortBy, selectedCategory, selectedBrandFilter, condition, year, featuredOnly]);
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
        setFeaturedOnly(false);
    };
    const activeFilterCount = selectedBrands.length + Number(priceRange[0] > 0 || priceRange[1] !== null) + Number(Boolean(selectedCategory)) + Number(Boolean(selectedBrandFilter)) + Number(Boolean(condition)) + Number(Boolean(year)) + Number(featuredOnly);
    const categoryOptions = Array.from(new Map([
        ...FIXED_CATEGORY_OPTIONS.map(c => ({ id: c.value, name: c.label })), ...categories,
    ].map(c => [c.name.toLowerCase(), c])).values());
    const filterSection = (
        <div className="space-y-6">
            <label className="block text-xs font-bold text-slate-600">Category
                <select aria-label="Category" value={categoryOptions.find(c => c.id === selectedCategory)?.name.toLowerCase() || selectedCategory?.toLowerCase() || ''} onChange={e => setSelectedCategory(e.target.value || null)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">All categories</option>
                    {categoryOptions.map(c => <option key={c.id} value={c.name.toLowerCase()}>{c.name}</option>)}
                </select>
            </label>
            <label className="block text-xs font-bold text-slate-600">{t('brand')}
                <select aria-label={t('brand')} value={selectedBrandFilter} onChange={e => { setSelectedBrandFilter(e.target.value); setSelectedBrands([]); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">All brands</option>
                    {brands.map(brand => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
                </select>
            </label>
            <PriceSlider value={priceRange} onChange={setPriceRange} ceiling={parts.reduce((max, p) => Math.max(max, p.price), 1000)} />
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-white text-black">
            <Navbar />

            {/* Mobile Filter Drawer */}
            <div
                className={`fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${showMobileFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setShowMobileFilters(false)}
            />
            <div className={`fixed inset-y-0 right-0 w-[85%] max-w-sm z-[10001] bg-white flex flex-col lg:hidden transition-transform duration-300 ease-out shadow-2xl ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="flex items-center gap-2 text-base font-black text-slate-900">
                        <SlidersHorizontal size={16} className="text-primary" />
                        {t('filters')}
                        {activeFilterCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-white">{activeFilterCount}</span>
                        )}
                    </h2>
                    <button onClick={() => setShowMobileFilters(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-slate-600 hover:bg-gray-200"><X size={16} /></button>
                </div>
                {/* Scrollable filter body — only this scrolls, page behind is locked */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                    {filterSection}
                </div>
                {/* Footer actions */}
                <div className="shrink-0 border-t border-gray-100 px-5 py-4 flex flex-col gap-2.5">
                    <button onClick={() => { setShowMobileFilters(false); scrollToProducts(); }} className="w-full rounded-2xl bg-primary py-3 text-sm font-black text-white transition hover:bg-primary-dark active:scale-95">{t('apply_filters')}</button>
                    <button onClick={resetFilters} className="w-full py-2 text-sm font-semibold text-gray-400 hover:text-gray-600">{t('reset')}</button>
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
                        {categories.some(category => category.is_popular === true && category.is_active !== false) && (
                            <nav aria-label="Popular categories" className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/70">
                                <span className="font-bold text-white/80">{t('popular')}</span>
                                {categories.filter(category => category.is_popular === true && category.is_active !== false).map(category => (
                                    <button key={category.id} type="button" aria-pressed={selectedCategory === category.id || selectedCategory?.toLowerCase() === category.name.toLowerCase()} onClick={() => { setSelectedCategory(category.id); setSearchQuery(''); scrollToProducts(); }} className="rounded-full border border-white/20 px-3 py-2 font-semibold transition hover:border-[#73e3e2] hover:text-white aria-pressed:border-[#73e3e2] aria-pressed:bg-[#73e3e2]/15 aria-pressed:text-[#9af3f0]">
                                        {category.name}
                                    </button>
                                ))}
                            </nav>
                        )}
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
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-6">

                    {/* Desktop Sidebar */}
                    <aside ref={filterSidebarRef} className="hidden h-[calc(100vh-6rem)] w-56 shrink-0 self-start lg:block xl:w-64" style={{ height: 'calc(100vh - 6rem)' }}>
                        <div
                            ref={filterPanelRef}
                            className="flex h-[calc(100vh-6rem)] min-h-[360px] max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:p-6"
                        >

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
                                {/* Sort by — left side */}
                                <div className="relative">
                                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                                        className="h-9 rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                                        <option value="most_recent">{t('most_recent')}</option>
                                        <option value="price_low_high">{t('price_low_high')}</option>
                                        <option value="price_high_low">{t('price_high_low')}</option>
                                    </select>
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>

                                {/* Grid / List toggle — right side */}
                                <div className="flex h-9 items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('grid')}
                                        aria-label="Grid view"
                                        aria-pressed={viewMode === 'grid'}
                                        className={`flex h-full w-9 items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                    >
                                        <LayoutGrid size={15} />
                                    </button>
                                    <span className="h-4 w-px bg-gray-200" />
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('list')}
                                        aria-label="List view"
                                        aria-pressed={viewMode === 'list'}
                                        className={`flex h-full w-9 items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'}`}
                                    >
                                        <List size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Active filter chips */}
                        {activeFilterCount > 0 && (
                            <div className="flex flex-wrap gap-2 mb-5">
                                {featuredOnly && <button onClick={() => setFeaturedOnly(false)} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">Featured <X size={11} /></button>}
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
                            <div data-products-grid className={viewMode === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'}>
                                {pageParts.map((part, idx) => (
                                    <Fragment key={part.id}>
                                        {viewMode === 'list' ? (
                                            <ListCard part={part as any} />
                                        ) : (
                                            <PartCard part={part as any} compact />
                                        )}
                                        {SHOW_PRODUCT_ADS && (idx + 1) % PRODUCTS_PER_AD === 0 && idx + 1 < pageParts.length && (
                                            <ProductAdSlot slot={(idx + 1) / PRODUCTS_PER_AD} />
                                        )}
                                    </Fragment>
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
                                        <Link href={adButtonHref} className="inline-flex bg-primary text-white px-8 py-4 rounded-2xl font-black hover:bg-primary-dark transition-all active:scale-95">
                                            {adConfig.buttonText || t('ad_button')}
                                        </Link>
                                    </div>
                                    <div className="relative w-full md:w-[320px] lg:w-[400px] aspect-video md:aspect-[16/10] bg-white rounded-3xl overflow-hidden border border-gray-200 transition-transform duration-500 hover:scale-105 shrink-0">
                                        <img src={adConfig.imageUrl || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80'} alt="Ad" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && !error && pageCount > 1 && (
                            <nav aria-label="Product pages" className="mt-10 flex flex-col items-center gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:justify-between">
                                <p className="text-sm font-medium text-slate-500">
                                    Showing <span className="font-bold text-slate-800">{(currentPage - 1) * productsPerPage + 1}–{Math.min(currentPage * productsPerPage, filteredParts.length)}</span> of <span className="font-bold text-slate-800">{filteredParts.length}</span> products
                                </p>
                                <div className="flex items-center gap-1.5" role="group" aria-label="Choose page">
                                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">‹</button>
                                    {Array.from({ length: pageCount }, (_, index) => index + 1).map(page => (
                                        <button key={page} type="button" onClick={() => goToPage(page)} aria-current={currentPage === page ? 'page' : undefined} className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition ${currentPage === page ? 'border-primary bg-primary text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'}`}>
                                            {page}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Next page" className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40">›</button>
                                </div>
                            </nav>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

function ListCard({ part }: { part: any }) {
    const { language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(part.favoriteId || null);
    const [loadingFavorite, setLoadingFavorite] = useState(false);

    useEffect(() => {
        if (authLoading || !user) { setIsLiked(false); setFavoriteId(null); return; }
        if (favoriteId) { setIsLiked(true); return; }
        let active = true;
        fetch('/api/favorites', { cache: 'no-store' })
            .then(r => r.json())
            .then(result => {
                if (!active || !result.success) return;
                const item = (result.favorites || []).find((f: any) => f.listing_id === part.id);
                setIsLiked(Boolean(item));
                setFavoriteId(item?.id || null);
            })
            .catch(() => {});
        return () => { active = false; };
    }, [authLoading, user, part.id, favoriteId]);

    const handleFavoriteToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (authLoading) return;
        if (!user) { router.push(`/login?next=${encodeURIComponent(`/buyer/${part.id}`)}`); return; }
        if (loadingFavorite) return;
        setLoadingFavorite(true);
        const next = !isLiked;
        setIsLiked(next);
        try {
            const r = await fetch('/api/favorites', {
                method: next ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listing_id: part.id }),
            });
            const result = await r.json();
            if (!r.ok || !result.success) throw new Error();
            setFavoriteId(next ? result.favorite?.id || null : null);
        } catch {
            setIsLiked(!next);
        } finally {
            setLoadingFavorite(false);
        }
    };

    return (
        <div className="relative flex gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-cyan-200 sm:p-4">
            <Link href={`/buyer/${part.id}`} className="absolute inset-0 rounded-xl" aria-label={`View ${part.partName}`} />

            {/* Image */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-28 sm:w-28">
                <img src={part.image} alt={part.partName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                {part.isFeatured && (
                    <span className="absolute left-1 top-1 rounded bg-rose-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Featured</span>
                )}
            </div>

            {/* Details */}
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#079bb5]">{part.brand}</span>
                    <h3 className="line-clamp-1 text-sm font-bold text-slate-900 sm:text-base">{part.partName}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} className="shrink-0 text-slate-400" />
                        {part.location}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">{part.category || 'General'}</span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-slate-600">{part.condition}</span>
                </div>
            </div>

            {/* Price + actions */}
            <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 sm:text-base">
                    {language === 'ur' ? 'روپے' : 'PKR'} {part.price.toLocaleString()}
                </span>
                <div className="z-10 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleFavoriteToggle}
                        aria-label={isLiked ? 'Remove from saved' : 'Save listing'}
                        aria-pressed={isLiked}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${isLiked ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-primary hover:text-primary'}`}
                    >
                        <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <Link
                        href={`/buyer/${part.id}`}
                        className="z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                        View <ArrowRight size={13} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
