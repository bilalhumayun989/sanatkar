import prisma from '@/lib/dbConn';
import { serializeListing } from '@/lib/listings';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import StoreCatalog from '@/app/components/features/StoreCatalog';
import Link from 'next/link';
import { ArrowLeft, Store, BadgeCheck, Package, Layers } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const shop = await prisma.profile.findFirst({
    where: { id, role: 'seller', sellerStatus: 'approved' },
    select: { shopName: true, shopDescription: true },
  });

  if (!shop) return { title: 'Shop Not Found | SanatKaar' };
  return {
    title: `${shop.shopName || 'Shop'} | SanatKaar`,
    description: shop.shopDescription || `Browse listings from ${shop.shopName || 'this shop'} on SanatKaar.`,
  };
}

export default async function PublicShopPage({ params }: PageProps) {
  const { id } = await params;

  const shop = await prisma.profile.findFirst({
    where: { id, role: 'seller', sellerStatus: 'approved' },
    select: {
      id: true,
      shopName: true,
      shopDescription: true,
      shopImageUrl: true,
      sellerStatus: true,
      verificationStatus: true,
      fullName: true,
      username: true,
      city: true,
    },
  });

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
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
            href="/buyer#products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            <ArrowLeft size={16} /> Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: id, status: 'active' },
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, username: true, fullName: true, role: true, city: true, shopName: true } } },
  });

  const isVerified = shop.verificationStatus === 'approved';
  const bannerImage = shop.shopImageUrl || null;
  const logoImage = shop.shopImageUrl || null;

  const parts = listings.map((item) => {
    const serialized = serializeListing(item as any);
    return {
      id: serialized.id,
      brand: serialized.brand || 'General',
      partName: serialized.title || 'Listing',
      price: Number(serialized.price) || 0,
      location: serialized.location || serialized.seller?.city || 'Pakistan',
      image: Array.isArray(serialized.image_urls) && serialized.image_urls[0] ? serialized.image_urls[0] : '/placeholder.png',
      compatibility: serialized.hours || 'Universal',
      condition: serialized.condition || 'New',
      stockStatus: serialized.stock_status || 'Not specified',
      isFeatured: Boolean(serialized.is_featured),
      sellerRole: serialized.seller?.role,
      sellerId: id,
      sellerName: serialized.seller?.full_name || serialized.seller?.username,
      category: serialized.category || 'General',
      createdAt: serialized.created_at || new Date().toISOString(),
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans">
      <Navbar forceSolid />

      <main className="flex-grow pt-32 lg:pt-20">
        {/* Banner Section */}
        <div className="relative mx-auto h-48 max-w-7xl overflow-hidden bg-slate-900 sm:h-64 lg:rounded-3xl">
          {bannerImage ? (
            <img 
              src={bannerImage} 
              alt={`${shop.shopName || shop.fullName || 'Shop'} Banner`} 
              className="w-full h-full object-cover opacity-75" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#12343a] via-[#174b54] to-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        </div>

        {/* Shop Info Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10 mb-7">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo / Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center p-1 bg-gradient-to-br from-slate-50 to-slate-100">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt={shop.shopName || shop.fullName || 'Shop'}
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
                    {shop.shopName || shop.fullName || shop.username || 'Unnamed Shop'}
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
          {shop.shopDescription && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 mb-10 shadow-sm">
              <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                <Store size={14} /> About Store
              </h2>
              <p className="whitespace-pre-wrap text-slate-600 text-sm leading-7">
                {shop.shopDescription}
              </p>
            </div>
          )}

          <StoreCatalog parts={parts} />

        </div>
      </main>

      <Footer />
    </div>
  );
}