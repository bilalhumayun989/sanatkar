'use client';

import { refreshOnRealtime } from '@/lib/realtime/client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Search, Store, CheckCircle2, Package, Users, ArrowUpRight } from 'lucide-react';

interface Shop {
  id: string;
  title: string;
  description?: string;
  image_urls?: string[] | null;
  listing_count?: number;
  verification_status?: string | null;
}

export default function AllShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await fetch('/api/shops', { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Failed to fetch shops');
        setShops(result.shops || []);
      } catch (error) {
        console.error('Failed to fetch shops:', error);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    void fetchShops();
    return refreshOnRealtime(['catalog', 'listings'], fetchShops);
  }, []);

  // Filter shops based on search query
  const filteredShops = useMemo(() => {
    if (!searchQuery.trim()) return shops;
    
    const query = searchQuery.toLowerCase();
    return shops.filter(shop =>
      shop.title.toLowerCase().includes(query) ||
      shop.description?.toLowerCase().includes(query)
    );
  }, [shops, searchQuery]);

  return (
   <div className="min-h-screen bg-[#f5f8fa]">
  <Navbar />

  {/* Slim Banner Section */}
  <section className="relative isolate overflow-hidden bg-[#12343a]">
    {/* Public Folder Image Background */}
    <img
      src="/shop.jfif" // Public folder me mojud image ka path
      alt="Banner Background"
      className="absolute inset-0 h-full w-full object-cover object-center"
    />

    <div className="absolute inset-0 bg-gradient-to-r from-[#0b2930]/95 via-[#10353c]/85 to-[#10353c]/35" />

    <div className="relative z-10 container-wide py-14 sm:py-18 md:py-20">
      <div className="max-w-2xl">
        {/* Badge (div replacement) */}
        <div className="inline-block mb-4">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-sm">
            <Store className="w-4 h-4 mr-2" />
            Shop Directory
          </div>
        </div>

        {/* Heading (div replacement for h1) */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">Find a shop for every need</h1>

        {/* Subtext */}
        <p className="text-white/90 text-lg mb-8 leading-relaxed max-w-2xl">
          Explore seller storefronts and browse the industrial products they have available.
        </p>

        {/* Search Bar */}
       <div className="max-w-md">
  <div className="relative flex items-center">
    {/* Search Icon ko z-20 aur pointer-events-none diya gaya hai */}
    <Search className="absolute left-4 z-20 text-slate-400 w-5 h-5 pointer-events-none" />
    
    <input
      type="text"
      placeholder="Search shops..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-12 pr-4 py-4 bg-white border border-white/70 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#73e3e2]/25 focus:border-[#73e3e2] transition-all relative z-10 shadow-xl"
    />
  </div>
</div>
      </div>
    </div>
  </section>


      {/* Main Content */}
      <section className="container-wide py-10 md:py-14">
        {/* Results Summary */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5">
          <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Explore shops</h2>
          <p className="mt-1 text-slate-600 text-sm">
            {loading ? (
              'Loading shops...'
            ) : (
              <>
                {searchQuery ? (
                  <>Showing {filteredShops.length} result{filteredShops.length !== 1 ? 's' : ''} for "{searchQuery}"</>
                ) : (
                  <>Showing {shops.length} shop{shops.length !== 1 ? 's' : ''}</>
                )}
              </>
            )}
          </p>
          </div>
          {!loading && !error && <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">{filteredShops.length} {filteredShops.length === 1 ? 'shop' : 'shops'}</span>}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="bg-slate-200 h-48 rounded-xl mb-4"></div>
                <div className="bg-slate-200 h-4 rounded mb-2"></div>
                <div className="bg-slate-200 h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredShops.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              {searchQuery ? 'No shops found' : 'No shops yet'}
            </h3>
            <p className="text-slate-500">
              {searchQuery 
                ? `Try adjusting your search term "${searchQuery}"`
                : 'Check back later for new shops'
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-[#09ACC9] hover:text-[#0092b8] font-medium transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Shops Grid */}
        {!loading && !error && filteredShops.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6 2xl:grid-cols-4">
            {filteredShops.map((shop, idx) => (
              <div 
                key={shop.id} 
                className="group w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.045)] transition-all duration-300 hover:-translate-y-1 hover:border-[#09ACC9]/35 hover:shadow-[0_16px_35px_rgba(15,23,42,0.10)]"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <Link href={`/shop/${shop.id}`}>
                  {/* Shop Image */}
                  <div className="relative aspect-[1.9/1] overflow-hidden bg-slate-100">
                    {Array.isArray(shop.image_urls) && shop.image_urls[0] ? (
                      <Image
                        src={shop.image_urls[0]}
                        alt={shop.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e9f7f8] via-slate-50 to-slate-100">
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white bg-white text-[#079bb5] shadow-sm"><Store className="h-9 w-9" /></div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />

                    {/* Verification Badge */}
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-end gap-2">
                      {shop.verification_status === 'approved' && <div className="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </div>}
                    </div>
                  </div>

                  {/* Shop Info */}
                  <div className="p-4 sm:p-5">
                    <div className="flex min-h-14 items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-lg font-bold leading-6 tracking-tight text-slate-900 transition-colors group-hover:text-[#078ba3]">{shop.title}</h3>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500"><Users size={14} className="text-[#079bb5]" />{shop.listing_count || 0}</span>
                    </div>
                    {/* Description */}
                    {shop.description && (
                      <p className="mt-2 mb-4 line-clamp-2 min-h-11 text-sm leading-5 text-slate-500">
                        {shop.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#09ACC9]" />
                        <span>{shop.listing_count || 0} active listing{shop.listing_count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#079bb5]">Browse inventory</span>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-medium text-slate-500">Explore this storefront</span>
                      <span className="inline-flex items-center gap-2 rounded-xl bg-[#079bb5] px-4 py-2.5 text-xs font-bold text-white transition-colors group-hover:bg-[#087c91]">
                        View shop <ArrowUpRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
