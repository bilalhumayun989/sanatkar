import { createServerSupabaseClient } from '@/lib/auth/supabase/server';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import Link from 'next/link';
import { ArrowLeft, Store, BadgeCheck, Package } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: shop } = await supabase
    .from('shops')
    .select('title, description')
    .eq('seller_id', id)
    .maybeSingle();

  if (!shop) return { title: 'Shop Not Found | SanatKaar' };
  return {
    title: `${shop.title} | SanatKaar`,
    description: shop.description || `Browse listings from ${shop.title} on SanatKaar.`,
  };
}

export default async function PublicShopPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('*')
    .eq('seller_id', id)
    .maybeSingle();

  if (shopError || !shop) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Shop Not Found</h2>
          <p className="text-slate-500 mb-6 font-medium max-w-sm text-xs sm:text-sm">
            This shop doesn't exist or hasn't been set up yet.
          </p>
          <Link 
            href="/buyer" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const isVerified = shop.verification_status === 'verified';
  const bannerImage = shop.image_urls?.[0] || null;
  const logoImage = shop.image_urls?.[1] || shop.image_urls?.[0] || null;

  const parts = (listings || []).map((item: any) => ({
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
    sellerId: id,
    sellerName: null,
    category: item.category || 'General',
    createdAt: item.created_at || new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      <main className="flex-grow pt-16 sm:pt-20">
        {/* Banner Section */}
        <div className="relative h-44 sm:h-60 w-full bg-slate-900 overflow-hidden">
          {bannerImage ? (
            <img 
              src={bannerImage} 
              alt={`${shop.title} Banner`} 
              className="w-full h-full object-cover opacity-70" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-primary/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        </div>

        {/* Shop Info Container */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10 mb-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-5 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            
            {/* Mobile Accent Line */}
            <div className="h-1.5 w-full bg-white rounded-t-2xl md:hidden -mt-5 -mx-5 mb-3" />

            <div className="flex items-center gap-4 sm:gap-5">
              {/* Logo / Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl border-2 border-white shadow-md overflow-hidden shrink-0 flex items-center justify-center p-0.5 -mt-8 sm:-mt-12">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={shop.title} 
                    className="w-full h-full object-cover rounded-xl" 
                  />
                ) : (
                  <Store className="w-8 h-8 text-primary" />
                )}
              </div>

              {/* Title & Stats */}
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                    {shop.title}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      <BadgeCheck size={13} className="text-emerald-600" /> Verified Seller
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs sm:text-sm mt-1 flex items-center gap-1.5 font-semibold">
                  <Package size={14} className="text-primary" />
                  <span>{parts.length} Active {parts.length === 1 ? 'Listing' : 'Listings'}</span>
                </p>
              </div>
            </div>

            {/* Back Button */}
            <Link
              href="/buyer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-[0.98]"
            >
              <ArrowLeft size={15} /> Back to Marketplace
            </Link>

          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          
          {/* Shop Description */}
          {shop.description && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-5 sm:p-7 mb-8 shadow-sm">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                About Store
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                {shop.description}
              </p>
            </div>
          )}

          {/* Section Heading */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/80">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Active Listings
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-200/60 px-3 py-1 rounded-full">
              {parts.length} Items
            </span>
          </div>

          {/* Listings Grid */}
          {parts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {parts.map((part) => (
                <PartCard key={part.id} part={part as any} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-12 text-center shadow-sm">
              <Store size={36} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No Listings Available</h3>
              <p className="text-slate-500 text-xs mt-1">
                This store has not published any items yet.
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}