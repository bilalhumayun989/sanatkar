import { createServerSupabaseClient } from '@/lib/auth/supabase/server';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import Link from 'next/link';
import { ArrowLeft, Store, BadgeCheck, Package, Layers } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: shop } = await supabase
    .from('profiles')
    .select('shop_name, shop_description')
    .eq('id', id)
    .eq('role', 'seller')
    .eq('seller_status', 'approved')
    .maybeSingle();

  if (!shop) return { title: 'Shop Not Found | SanatKaar' };
  return {
    title: `${shop.shop_name || 'Shop'} | SanatKaar`,
    description: shop.shop_description || `Browse listings from ${shop.shop_name || 'this shop'} on SanatKaar.`,
  };
}

export default async function PublicShopPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: shop, error: shopError } = await supabase
    .from('profiles')
    .select('shop_name, shop_description, shop_image_url, seller_status')
    .eq('id', id)
    .eq('role', 'seller')
    .eq('seller_status', 'approved')
    .maybeSingle();

  if (shopError || !shop) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar forceSolid />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center pt-32">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Shop Not Found</h2>
          <p className="text-slate-500 mb-6 font-medium max-w-sm text-xs sm:text-sm">
            This shop doesn't exist or hasn't been set up yet.
          </p>
          <Link 
            href="/" 
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

  const isVerified = shop.seller_status === 'approved';
  const bannerImage = shop.shop_image_url || null;
  const logoImage = shop.shop_image_url || null;

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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-20">
        {/* Banner Section */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-900 overflow-hidden">
          {bannerImage ? (
            <img 
              src={bannerImage} 
              alt={`${shop.shop_name || 'Shop'} Banner`} 
              className="w-full h-full object-cover opacity-75" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-primary/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        {/* Shop Info Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 relative z-10 mb-10">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xl shadow-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo / Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center p-1 -mt-12 sm:-mt-16 bg-gradient-to-br from-slate-50 to-slate-100">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={shop.shop_name || 'Shop'} 
                    className="w-full h-full object-cover rounded-xl" 
                  />
                ) : (
                  <Store className="w-10 h-10 text-primary" />
                )}
              </div>

              {/* Title & Meta Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {shop.shop_name || 'Unnamed Shop'}
                  </h1>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                      <BadgeCheck size={14} className="text-emerald-600" /> Verified Seller
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs sm:text-sm mt-1.5 flex items-center gap-2 font-semibold">
                  <Package size={15} className="text-primary" />
                  <span>{parts.length} Active {parts.length === 1 ? 'Listing' : 'Listings'}</span>
                </p>
              </div>
            </div>

            {/* Marketplace Navigation */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft size={16} /> Back to Marketplace
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          
          {/* Shop Description */}
          {shop.shop_description && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-10 shadow-sm">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                <Store size={14} /> About Store
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                {shop.shop_description}
              </p>
            </div>
          )}

          {/* Section Heading Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Layers className="text-primary" size={20} />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Active Marketplace Ads
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
              {parts.length} {parts.length === 1 ? 'Item' : 'Items'} Available
            </span>
          </div>

          {/* Listings Grid Section */}
          {parts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {parts.map((part) => (
                <PartCard key={part.id} part={part as any} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Store size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Listings</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto">
                This store does not have any inventory listed for sale at the moment.
              </p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}