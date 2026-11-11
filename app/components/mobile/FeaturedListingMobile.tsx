'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  image_urls: string[] | null;
  year?: string;
  brand?: string | null;
  condition?: string | null;
  is_featured?: boolean | null;
}

export default function FeaturedListingsMobile({ initialListings }: { initialListings: Listing[] }) {
  const featuredListings = initialListings;

  if (featuredListings.length === 0) return null;

  return (
    <section className="w-full py-1 lg:hidden">
      {/* Section Title */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900">Featured products</h2>
        <Link href="/featured" className="shrink-0 text-sm font-semibold text-[#079bb5] hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {featuredListings.map((item) => (
            <Link
              key={item.id}
              href={`/listings/${item.id}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-square w-full bg-slate-100">
                <Image
                  src={item.image_urls?.[0] || '/placeholder.png'}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 46vw, 220px"
                  quality={75}
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#087c91] shadow-sm">
                  Featured
                </span>
              </div>

              <div className="flex flex-1 flex-col p-3">
                <div>
                  {item.brand && (
                    <span className="block truncate text-xs font-medium text-slate-500">
                      {item.brand}
                    </span>
                  )}
                  <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <div className="mt-2">
                  <div className="text-sm font-bold text-[#079bb5]">
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
