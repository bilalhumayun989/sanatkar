'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Search, Store, CheckCircle2, Package, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

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
        const supabase = createClient();
        
        // Load the badge field when available, but keep the directory usable before migration rollout.
        let { data: shopsData, error: shopsError } = await supabase
          .from('profiles')
          .select(`
            id,
            shop_name,
            shop_description,
            shop_image_url,
            verification_status
          `)
          .eq('role', 'seller')
          .eq('seller_status', 'approved');

        if (shopsError) {
          const fallback = await supabase
            .from('profiles')
            .select('id, shop_name, shop_description, shop_image_url')
            .eq('role', 'seller')
            .eq('seller_status', 'approved');
          shopsData = fallback.data?.map(shop => ({ ...shop, verification_status: null })) || null;
          shopsError = fallback.error;
        }

        if (shopsError) {
          console.error('Error fetching shops:', shopsError);
          setError('Failed to fetch shops');
          return;
        }

        // Get listing counts for each shop
        const shopsWithCounts = await Promise.all(
          (shopsData || []).map(async (shop) => {
            const { count } = await supabase
              .from('listings')
              .select('*', { count: 'exact', head: true })
              .eq('seller_id', shop.id)
              .eq('status', 'active');

            return {
              id: shop.id,
              title: shop.shop_name || 'Unnamed Shop',
              description: shop.shop_description || '',
              image_urls: shop.shop_image_url ? [shop.shop_image_url] : [],
              verification_status: shop.verification_status,
              listing_count: count || 0
            };
          })
        );

        setShops(shopsWithCounts);
      } catch (error) {
        console.error('Failed to fetch shops:', error);
        setError('Failed to load shops');
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
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
   <div className="min-h-screen bg-slate-50">
  <Navbar />

  {/* Slim Banner Section */}
  <section className="relative overflow-hidden">
    {/* Public Folder Image Background */}
    <img
      src="/shop.jfif" // Public folder me mojud image ka path
      alt="Banner Background"
      className="absolute  w-full h-full object-cover object-top"
    />

    {/* Subtle Dark Overlay for Text Visibility */}
    {/* <div className="absolute inset-0 bg-slatex-900/70 backdrop-blur-[2px]"></div> */}

    <div className="relative z-10 container-wide py-12 md:py-30 ">
      <div className="max-w-7xl">
        {/* Badge (div replacement) */}
        <div className="inline-block mb-4">
          <div className="inline-flex items-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white shadow-sm">
            <Store className="w-4 h-4 mr-2" />
            Shop Directory
          </div>
        </div>

        {/* Heading (div replacement for h1) */}
        <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
          Browse Shops
        </div>

        {/* Subtext */}
        <p className="text-white/90 text-lg mb-8 leading-relaxed max-w-2xl">
          Explore verified sellers and their storefronts
        </p>

        {/* Search Bar */}
       <div className="max-w-md">
  <div className="relative flex items-center">
    {/* Search Icon ko z-20 aur pointer-events-none diya gaya hai */}
    <Search className="absolute left-4 z-20 text-white/70 w-5 h-5 pointer-events-none" />
    
    <input
      type="text"
      placeholder="Search shops..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#09ACC9]/50 focus:border-[#09ACC9] transition-all backdrop-blur-sm relative z-10"
    />
  </div>
</div>
      </div>
    </div>
  </section>


      {/* Main Content */}
      <section className="container-wide py-12 md:py-16">
        {/* Results Summary */}
        <div className="mb-8">
          <p className="text-slate-600 text-sm">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            {filteredShops.map((shop, idx) => (
              <div 
                key={shop.id} 
                className="reveal-up group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#09ACC9]/30 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <Link href={`/shop/${shop.id}`}>
                  {/* Shop Image */}
                  <div className="relative aspect-[1.55/1] overflow-hidden bg-slate-100">
                    {Array.isArray(shop.image_urls) && shop.image_urls[0] ? (
                      <Image
                        src={shop.image_urls[0]}
                        alt={shop.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#09ACC9]/10 to-slate-100">
                        <Store className="h-16 w-16 text-slate-300 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

                    {/* Verification Badge */}
                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-white/25 bg-slate-950/35 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white/85 backdrop-blur-sm">
                        Industrial shop
                      </span>
                      {shop.verification_status === 'approved' && <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </div>}
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                      <h3 className="line-clamp-1 text-xl font-black tracking-tight drop-shadow-sm">{shop.title}</h3>
                      <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-white/80"><Users size={13} /> {shop.listing_count || 0}</span>
                    </div>
                  </div>

                  {/* Shop Info */}
                  <div className="p-5">
                    {/* Description */}
                    {shop.description && (
                      <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-500">
                        {shop.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-[#09ACC9]" />
                        <span>{shop.listing_count || 0} active listing{shop.listing_count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#079bb5]">Browse inventory</span>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-bold text-slate-400 transition-colors group-hover:text-slate-600">Explore storefront</span>
                      <span className="rounded-xl bg-[#09ACC9] px-4 py-2.5 text-xs font-black text-white shadow-md shadow-[#09ACC9]/20 transition-all duration-300 group-hover:bg-[#0092b8] group-hover:shadow-lg">
                        View Shop <span aria-hidden="true" className="ml-1">→</span>
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