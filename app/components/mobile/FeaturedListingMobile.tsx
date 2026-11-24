'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  image_urls: string[] | null;
  year?: string | null;
  brand?: string | null;
  condition?: string | null;
  is_featured?: boolean | null;
}

export default function FeaturedListingsMobile({ initialListings }: { initialListings: Listing[] }) {
  const { t } = useLanguage();
  const featuredListings = initialListings;

  if (featuredListings.length === 0) return null;

  return (
    <section className="w-full py-2 lg:hidden">
      {/* Section Title */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{t('featured_items')}</h2>
          <p className="mt-1 text-xs text-slate-500">{t('featured_desc')}</p>
        </div>
        <Link href="/buyer?featured=true#products" className="shrink-0 px-1 py-2 text-xs font-medium text-blue-600 transition hover:text-blue-800">
          {t('view_all_featured')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featuredListings.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[3/2] w-full bg-slate-100">
                <Image
                  src={item.image_urls?.[0] || '/placeholder.png'}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 46vw, 220px"
                  loading="lazy"
                  decoding="async"
                  quality={75}
                  className="object-cover"
                />
                <span className="absolute right-2 top-2 rounded-sm bg-rose-700 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow">Featured</span>
              </div>

              <div className="flex flex-1 flex-col p-2.5">
                <div>
                  {item.brand && (
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {item.brand}
                    </span>
                  )}
                  <h3 className="mt-0.5 line-clamp-2 min-h-9 text-sm font-semibold leading-5 text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-1.5">
                  <div className="text-sm font-bold text-[#006b80]">
                    PKR {item.price?.toLocaleString()}
                  </div>
                  <div className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0" /> {item.location || 'Pakistan'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
