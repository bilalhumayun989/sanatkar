'use client';

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import Link from 'next/link';
import { ArrowLeft, Store, BadgeCheck, Package, Layers, Search, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SellerProfilePage({ params }: PageProps) {
  const [shopId, setShopId] = useState<string | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    params.then((res) => setShopId(res.id));
  }, [params]);

  useEffect(() => {
    if (!shopId) return;

    const fetchShopData = async () => {
      try {
        const supabase = createClient();

        const { data: shopData } = await supabase
          .from('shops')
          .select('*')
          .eq('seller_id', shopId)
          .maybeSingle();

        if (shopData) {
          setShop(shopData);

          const { data: listings } = await supabase
            .from('listings')
            .select('*')
            .eq('seller_id', shopId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

          const mappedParts = (listings || []).map((item: any) => ({
            id: item.id,
            brand: item.brand || item.make || 'General',
            partName: item.title || `${item.make || ''} ${item.model || ''}`.trim() || 'Listing',
            price: Number(item.price) || 0,
            location: item.location || item.city || 'Pakistan',
            image: Array.isArray(item.image_urls) && item.image_urls[0]
              ? item.image_urls[0]
              : 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg',
            compatibility: item.mileage || 'Universal',
            condition: item.condition || 'New',
            stockStatus: 'In Stock',
            isFeatured: false,
            sellerRole: null,
            sellerId: shopId,
            sellerName: null,
            category: item.category || 'General',
            createdAt: item.created_at || new Date().toISOString(),
          }));

          setParts(mappedParts);
        }
      } catch (err) {
        console.error('Failed to load seller profile data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [shopId]);

  const filteredParts = useMemo(() => {
    if (!searchQuery.trim()) return parts;
    const query = searchQuery.toLowerCase().trim();

    return parts.filter((item) => {
      const partName = (item.partName || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const location = (item.location || '').toLowerCase();

      return (
        partName.includes(query) ||
        brand.includes(query) ||
        category.includes(query) ||
        location.includes(query)
      );
    });
  }, [parts, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar forceSolid />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-slate-500 pt-32">
          <Loader2 className="mb-3 animate-spin text-primary" size={36} />
          <p className="text-sm font-semibold">Loading seller profile & listings...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar forceSolid />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center pt-32">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200/80 rounded-3xl flex items-center justify-center mb-5 shadow-sm">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 tracking-tight">Seller Not Found</h2>
          <p className="text-slate-500 mb-6 font-medium max-w-sm text-xs sm:text-sm">
            This seller profile doesn't exist or hasn't been set up yet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isVerified = shop.verification_status === 'verified';
  const bannerImage = shop.image_urls?.[0] || null;
  const logoImage = shop.image_urls?.[1] || shop.image_urls?.[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans selection:bg-primary/20">
      <Navbar forceSolid />

      <main className="flex-grow pt-20">
        <div className="relative h-52 sm:h-72 w-full bg-slate-950 overflow-hidden">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={`${shop.title} Banner`}
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-950/40 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10 mb-10">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white rounded-2xl sm:rounded-3xl border-4 border-white shadow-xl overflow-hidden shrink-0 flex items-center justify-center p-1 -mt-14 sm:-mt-20 bg-gradient-to-br from-slate-50 to-slate-100">
                {logoImage ? (
                  <img
                    src={logoImage}
                    alt={shop.title}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                  />
                ) : (
                  <Store className="w-10 h-10 text-primary" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {shop.title}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      <BadgeCheck size={14} className="text-emerald-600" /> Verified Seller
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs sm:text-sm mt-2 flex items-center gap-2 font-bold">
                  <Package size={15} className="text-primary" />
                  <span>{parts.length} Active {parts.length === 1 ? 'Listing' : 'Listings'}</span>
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 text-slate-700 font-bold text-xs transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft size={16} /> Back to Marketplace
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {shop.description && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-10 shadow-sm">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                <Store size={15} /> About Store
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {shop.description}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Layers size={20} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Active Marketplace Ads
              </h2>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items in this shop..."
                className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {filteredParts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300/80 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Store size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {searchQuery ? 'No Matching Items Found' : 'No Active Listings'}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto font-medium mb-4">
                {searchQuery
                  ? `No items found matching "${searchQuery}". Try searching with another term.`
                  : 'This store does not have any inventory listed for sale at the moment.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

