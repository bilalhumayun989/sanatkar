import Link from 'next/link';
import { Store, BadgeCheck, ChevronRight } from 'lucide-react';

interface Shop {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  image_urls: string[];
  verification_status: string;
}

interface ShopsSectionProps {
  shops: Shop[];
}

export default function ShopsSection({ shops }: ShopsSectionProps) {
  if (!shops || shops.length === 0) return null;

  return (
    <section className="py-8 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> Verified Shops & Sellers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Explore trusted stores and their original parts
            </p>
          </div>
        </div>

        {/* Mobile Horizontal Scroll / Desktop Grid Layout */}
        <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {shops.map((shop) => {
            const bannerImage = shop.image_urls?.[0] || null;
            const logoImage = shop.image_urls?.[1] || shop.image_urls?.[0] || null;
            const isVerified = shop.verification_status === 'verified';

            return (
              <Link
                key={shop.id}
                href={`/shop/${shop.seller_id}`}
                className="group shrink-0 w-[240px] sm:w-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Shop Cover Banner */}
                <div className="relative h-20 sm:h-24 w-full bg-slate-900 overflow-hidden">
                  {/* Mobile-Only Top Accent Indicator */}
                  <div className="h-1 w-full bg-primary relative z-20 sm:hidden" />
                  
                  {bannerImage ? (
                    <img
                      src={bannerImage}
                      alt={shop.title}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-900 via-slate-800 to-primary/30" />
                  )}
                </div>

                {/* Shop Information Body */}
                <div className="p-4 pt-0 relative flex-grow flex flex-col">
                  {/* Shop Avatar */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl border-2 border-white shadow-md overflow-hidden flex items-center justify-center -mt-6 relative z-10 shrink-0 mb-2">
                    {logoImage ? (
                      <img
                        src={logoImage}
                        alt={shop.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-primary" />
                    )}
                  </div>

                  {/* Title & Verified Badge */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-primary transition-colors truncate">
                      {shop.title}
                    </h3>
                    {isVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 flex-grow">
                    {shop.description || 'No description provided.'}
                  </p>

                  {/* View Button Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-primary">
                    <span>Visit Store</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}