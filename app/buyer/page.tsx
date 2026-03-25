'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PartCard from '../components/PartCard';
import { Part as PartType } from '../data/mockData';
import { Search, SlidersHorizontal, Check, Loader2, Package, Settings, RotateCcw } from 'lucide-react';

export default function BuyerPage() {
    const [parts, setParts] = useState<PartType[]>([]);
    const [adConfig, setAdConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParts = async () => {
            try {
                const res = await fetch('/api/cars'); // Keeping API route as is for now to maintain functionality
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
                    category: item.category || 'General'
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

        fetchParts();
        fetchAd();
    }, []);

    return (
        <div className="min-h-screen flex flex-col pt-[72px] bg-white text-black">
            <Navbar />

            {/* Search Hero Section */}
            <section className="bg-secondary py-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg')] bg-cover bg-center opacity-10 grayscale"></div>
                <div className="container-wide relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-black !text-white mb-6 leading-tight">
                            Find Your Perfect <span className="text-primary">Part</span>
                        </h1>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                                <Search size={24} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by brand, part name or keyword..."
                                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl py-6 pl-16 pr-6 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/20 transition-all text-lg shadow-2xl"
                            />
                            <button className="absolute right-3 top-3 bottom-3 bg-primary text-white px-8 rounded-2xl font-bold hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/30">
                                Search
                            </button>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mr-2">Popular:</span>
                            {['Tajima Hook', 'Barudan Belt', 'Janome Needle', 'Main Motor'].map((tag) => (
                                <button key={tag} className="text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="container-wide py-12">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-[2rem] border border-border shadow-premium p-8 sticky top-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    Filters <SlidersHorizontal size={18} className="text-primary" />
                                </h3>
                                <button className="text-primary text-xs font-bold hover:underline underline-offset-4">Reset</button>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Price Range</h4>
                                    <div className="space-y-3">
                                        {['Under 5,000', '5,000 - 15,000', '15,000 - 50,000', '50,000+'].map((range) => (
                                            <label key={range} className="flex items-center group cursor-pointer">
                                                <div className="relative flex items-center justify-center">
                                                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-border rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
                                                    <div className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                </div>
                                                <span className="ml-3 text-sm font-bold text-secondary/70 group-hover:text-primary transition-colors">{range}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Brand</h4>
                                    <div className="space-y-3">
                                        {['Tajima', 'Barudan', 'Janome', 'Groz-Beckert', 'Brother'].map((brand) => (
                                            <label key={brand} className="flex items-center group cursor-pointer">
                                                <div className="relative flex items-center justify-center">
                                                    <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-border rounded-lg checked:bg-primary checked:border-primary transition-all cursor-pointer" />
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

                            <div className="mt-10 pt-8 border-t border-border">
                                <button className="w-full bg-secondary text-white py-4 rounded-2xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95">
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Part List Container */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-secondary">
                                    Results <span className="text-primary">({parts.length})</span>
                                </h2>
                                <p className="text-sm text-gray-400 font-medium">All verified industrial parts in Pakistan</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
                                <select className="bg-white border border-border rounded-xl px-4 py-2 text-sm font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                                    <option>Most Recent</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-gray-100 shadow-xl">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading authentic parts...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-10 py-12 rounded-[3rem] text-center">
                                <h3 className="text-xl font-black mb-2">Something went wrong</h3>
                                <p className="font-medium">{error}</p>
                            </div>
                        ) : parts.length === 0 ? (
                            <div className="bg-gray-50 border border-gray-200 text-gray-500 px-10 py-12 rounded-[3rem] text-center">
                                <h3 className="text-xl font-black mb-2">No parts found</h3>
                                <p className="font-medium">Try adjusting your filters or search criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                                {parts.map((part, idx) => (
                                    <div key={part.id} className="reveal-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <PartCard part={part as any} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Mid-grid subtle ad space */}
                        {adConfig && adConfig.isActive !== false && (
                            <div className="my-16">
                                <div className="bg-primary/5 rounded-[2.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="relative z-10 max-w-md">
                                        <span className="inline-block bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-4 tracking-[0.2em]">{adConfig.badgeText || 'PROMOTED'}</span>
                                        <h3 className="text-3xl font-black text-secondary mb-4 leading-tight">{adConfig.title || 'Want to Sell Your Parts Fast & Extra Easy?'}</h3>
                                        <p className="text-secondary/60 text-sm font-medium mb-6">{adConfig.description || 'List your industrial components today and get them seen by thousands of production units across Pakistan.'}</p>
                                        <Link href={adConfig.buttonLink || '/seller'}>
                                            <button className="bg-secondary text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-secondary/20">
                                                {adConfig.buttonText || 'Post an Ad for Free'}
                                            </button>
                                        </Link>
                                    </div>
                                    <div className="relative w-full md:w-[350px] aspect-[16/10] bg-white rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
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

                        {!loading && parts.length > 0 && (
                            <div className="mt-16 flex justify-center">
                                <button className="bg-white border border-border text-secondary font-black px-12 py-5 rounded-[2rem] hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-300 shadow-premium active:scale-95">
                                    Load More Parts
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
