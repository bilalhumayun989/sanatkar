'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PartCard from '../components/PartCard';
import { Part as PartType } from '../data/mockData';
import { Search, SlidersHorizontal, Check, Loader2, Package, Settings, RotateCcw, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function BuyerPage() {
    const { t, language } = useLanguage();
    const { isAdmin } = useAuth();
    const [parts, setParts] = useState<PartType[]>([]);
    const [adConfig, setAdConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('most_recent');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [popularCategories, setPopularCategories] = useState<any[]>([]);

    const priceRanges = [
        { id: 'under_5k', label: 'Under 5,000', min: 0, max: 5000 },
        { id: '5k_15k', label: '5,000 - 15,000', min: 5000, max: 15000 },
        { id: '15k_50k', label: '15,000 - 50,000', min: 15000, max: 50000 },
        { id: '50k_plus', label: '50,000+', min: 50000, max: Infinity },
    ];

    const brands = ['Tajima', 'Barudan', 'Janome', 'Groz-Beckert', 'Brother'];

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const res = await fetch('/api/cars');
                if (!res.ok) throw new Error('Failed to fetch parts');
                const data = await res.json();
                
                const list = Array.isArray(data) ? data : (data.data ?? []);
                const mappedParts: any[] = list.map((item: any) => ({
                    id: item._id,
                    brand: item.make,
                    partName: item.model,
                    price: item.price,
                    location: item.location,
                    image: item.images?.[0] || 'https://ae01.alicdn.com/kf/H9872be9c3c5448388915e7fb04899583E/KHS12-RYP-Tajima-Embroidery-Machine-Parts-Rotary-Hook.jpg',
                    compatibility: item.mileage || 'Universal',
                    condition: item.fuelType || 'New',
                    stockStatus: item.transmission || 'In Stock',
                    featured: item.status === 'available',
                    category: item.category || 'General',
                    createdAt: item.createdAt || new Date().toISOString()
                }));
                
                setParts(mappedParts);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchAd = async () => {
            try {
                const res = await fetch('/api/ad');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.ad) {
                        setAdConfig(data.ad);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch ad config", e);
            }
        };

        const fetchPopularCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                const data = await res.json();
                if (data.success) {
                    setPopularCategories(data.categories.filter((c: any) => c.isPopular).slice(0, 5));
                }
            } catch (err) {
                console.error('Failed to fetch popular categories:', err);
            }
        };

        fetchParts();
        fetchAd();
        fetchPopularCategories();
    }, []);

    // Filter Logic
    const filteredParts = useMemo(() => {
        let result = [...parts];

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.partName.toLowerCase().includes(query) || 
                p.brand.toLowerCase().includes(query)
            );
        }

        // Brand Filter
        if (selectedBrands.length > 0) {
            result = result.filter(p => selectedBrands.includes(p.brand));
        }

        // Price Range Filter
        if (selectedPriceRanges.length > 0) {
            result = result.filter(p => {
                return selectedPriceRanges.some(rangeId => {
                    const range = priceRanges.find(r => r.id === rangeId);
                    if (!range) return false;
                    return p.price >= range.min && p.price < range.max;
                });
            });
        }

        // Sorting
        switch (sortBy) {
            case 'price_low_high':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price_high_low':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'most_recent':
            default:
                result.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
                break;
        }

        return result;
    }, [parts, searchQuery, selectedBrands, selectedPriceRanges, sortBy]);

    const handleBrandToggle = (brand: string) => {
        setSelectedBrands(prev => 
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handlePriceToggle = (rangeId: string) => {
        setSelectedPriceRanges(prev => 
            prev.includes(rangeId) ? prev.filter(r => r !== rangeId) : [...prev, rangeId]
        );
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedBrands([]);
        setSelectedPriceRanges([]);
        setSortBy('most_recent');
    };

    const FilterSection = () => (
        <div className="space-y-10">
            <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('price_range')}</h4>
                <div className="space-y-3">
                    {priceRanges.map((range) => (
                        <label key={range.id} className="flex items-center group cursor-pointer">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedPriceRanges.includes(range.id)}
                                    onChange={() => handlePriceToggle(range.id)}
                                    className="peer appearance-none w-5 h-5 border-2 border-border rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                                />
                                <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            </div>
                            <span className="ml-3 text-sm font-bold text-secondary/70 group-hover:text-primary transition-colors">{range.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('brand')}</h4>
                <div className="space-y-3">
                    {brands.map((brand) => (
                        <label key={brand} className="flex items-center group cursor-pointer">
                            <div className="relative flex items-center justify-center">
                                <input 
                                    type="checkbox" 
                                    checked={selectedBrands.includes(brand)}
                                    onChange={() => handleBrandToggle(brand)}
                                    className="peer appearance-none w-5 h-5 border-2 border-border rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" 
                                />
                                <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                                    <Check size={14} strokeWidth={4} />
                                </div>
                            </div>
                            <span className="ml-3 text-sm font-bold text-secondary/70 group-hover:text-primary transition-colors">{brand}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col pt-[72px] bg-white text-black">
            <Navbar />

            {/* Mobile Filter Drawer Overlay */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[1001] lg:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
                    <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black">{t('filters')}</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <FilterSection />
                        <div className="mt-10 pt-8 border-t border-border flex flex-col gap-4">
                            <button 
                                onClick={resetFilters}
                                className="w-full py-4 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-600 transition-all"
                            >
                                {t('reset')}
                            </button>
                            <button 
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full bg-secondary text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                            >
                                {t('apply_filters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Hero Section */}
            <section className="bg-secondary py-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg')] bg-cover bg-center opacity-10 grayscale"></div>
                <div className="container-wide relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-black !text-white mb-6 leading-tight">
                            {language === 'en' ? (
                                <>Find Your Perfect <span className="text-primary">Part</span></>
                            ) : (
                                <>اپنے مطلوبہ <span className="text-primary">پرزے</span> تلاش کریں</>
                            )}
                        </h1>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Search size={24} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl py-6 pl-16 pr-6 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white transition-all text-lg shadow-2xl"
                            />
                            <button className="absolute right-3 top-3 bottom-3 bg-primary text-white md:px-8 px-4 rounded-2xl font-bold hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/30">
                                {t('search')}
                            </button>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3 items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1 mr-2">{t('popular')}:</span>
                            {popularCategories.length > 0 ? (
                                popularCategories.map((c) => (
                                    <button 
                                        key={c._id} 
                                        onClick={() => setSearchQuery(c.name)}
                                        className="text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all shadow-sm"
                                    >
                                        {c.name}
                                    </button>
                                ))
                            ) : (
                                <span className="text-[10px] text-gray-500 font-bold italic tracking-wide">No popular categories available</span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-wide py-12">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Filters Sidebar (Desktop) */}
                    <aside className="hidden lg:block w-72 flex-shrink-0">
                        <div className="bg-white rounded-[2rem] border border-border shadow-premium p-8 sticky top-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {t('filters')} <SlidersHorizontal size={18} className="text-primary" />
                                </h3>
                                <button 
                                    onClick={resetFilters}
                                    className="text-primary text-xs font-bold hover:underline underline-offset-4"
                                >
                                    {t('reset')}
                                </button>
                            </div>

                            <FilterSection />

                            <div className="mt-10 pt-8 border-t border-border">
                                <button 
                                    onClick={() => window.scrollTo({ top: 300, behavior: 'smooth' })}
                                    className="w-full bg-secondary text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                                >
                                    {t('apply_filters')}
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Part List Container */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center justify-between w-full md:w-auto">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-secondary">
                                        {t('results')} <span className="text-primary">({filteredParts.length})</span>
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium">{t('verified_parts_desc')}</p>
                                </div>
                                {/* Mobile Filter Toggle */}
                                <button 
                                    onClick={() => setShowMobileFilters(true)}
                                    className="lg:hidden flex items-center gap-2 bg-white border border-border px-5 py-3 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                                >
                                    <SlidersHorizontal size={16} /> {t('filters')}
                                </button>
                            </div>
                            <div className="flex items-center gap-4 self-end md:self-auto">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('sort_by')}</span>
                                <div className="relative">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-white border border-border rounded-xl px-5 py-2.5 text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10 shadow-sm"
                                    >
                                        <option value="most_recent">{t('most_recent')}</option>
                                        <option value="price_low_high">{t('price_low_high')}</option>
                                        <option value="price_high_low">{t('price_high_low')}</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t('loading_parts')}</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-10 py-12 rounded-[3rem] text-center">
                                <h3 className="text-xl font-black mb-2">{t('error_occurred')}</h3>
                                <p className="font-medium">{error}</p>
                            </div>
                        ) : filteredParts.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 text-gray-500 px-10 py-12 rounded-[3rem] text-center">
                                <h3 className="text-xl font-black mb-2">{t('no_parts_found')}</h3>
                                <p className="font-medium">{t('adjust_filters')}</p>
                                <button 
                                    onClick={resetFilters}
                                    className="mt-6 text-primary font-bold hover:underline"
                                >
                                    {t('reset_all_filters')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredParts.map((part, idx) => (
                                    <div key={part.id} className="reveal-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <PartCard part={part as any} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Mid-grid subtle ad space */}
                        {adConfig && adConfig.isActive !== false && (
                            <div className="my-16">
                                <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="relative z-10 max-w-md text-center md:text-left">
                                        <span className="inline-block bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-4 tracking-[0.2em]">{adConfig.badgeText || t('promoted_badge')}</span>
                                        <h3 className="text-3xl font-black text-secondary mb-4 leading-tight">{adConfig.title || t('ad_title')}</h3>
                                        <p className="text-secondary/60 text-sm font-medium mb-6">{adConfig.description || t('ad_desc')}</p>
                                        <Link href={adConfig.buttonLink || '/seller'}>
                                            <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-secondary/20">
                                                {adConfig.buttonText || t('ad_button')}
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="relative w-full md:w-[320px] lg:w-[400px] aspect-[16/10] bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                        <img
                                            src={adConfig.imageUrl || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80"}
                                            alt="Promotional Ad"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && filteredParts.length > 0 && (
                            <div className="mt-16 flex justify-center">
                                <button className="bg-white border border-border text-secondary font-black px-12 py-5 rounded-[2rem] hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-300 shadow-premium active:scale-95">
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
