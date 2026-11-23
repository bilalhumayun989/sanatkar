'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  description?: string;
  is_active?: boolean | null;
}

const CategoryImage = ({
  name,
  imageUrl,
  priority,
  rounded = true,
}: { 
  name: string; 
  imageUrl?: string | null;
  priority?: boolean;
  rounded?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);

  // If image_url exists and hasn't failed to load
  if (imageUrl && imageUrl.trim() !== '' && !imageError) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={280}
        height={200}
        sizes="(max-width: 640px) 45vw, 280px"
        priority={priority}
        className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${rounded ? 'rounded-full' : ''}`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: Display first letter of category name if image is missing or broken
  return (
    <div className="flex h-full w-full items-center justify-center bg-cyan-50 text-cyan-700 font-black text-2xl sm:text-3xl uppercase transition-transform duration-300 group-hover:scale-105 select-none">
      {name.charAt(0)}
    </div>
  );
};

export default function CategoriesSection({ categories = [], title, prioritizeFirstImage = false, variant = 'browse', maxItems }: { categories: Category[]; title?: string; prioritizeFirstImage?: boolean; variant?: 'browse' | 'popular'; maxItems?: number }) {
  const { t } = useLanguage();
  const activeCategories = categories.filter((cat) => cat.is_active !== false);
  const visibleCategories = maxItems ? activeCategories.slice(0, maxItems) : activeCategories;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll visibility states
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll availability dynamically
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollLeft = Math.ceil(el.scrollLeft);
      const maxScroll = el.scrollWidth - el.clientWidth;

      // Allow 2px threshold for sub-pixel rounding
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < maxScroll - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [activeCategories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className={variant === 'popular' ? 'home-deferred w-full py-2 md:py-3' : 'w-full py-2 md:py-3'}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{title || t('browse_categories')}</h2>
          {variant === 'popular' && <p className="mt-1 text-xs text-slate-600 sm:text-sm">Choose a category to see available listings.</p>}
        </div>
        <Link
          href="/buyer"
          className={variant === 'popular' ? 'shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#006b80] transition hover:border-cyan-300 hover:bg-cyan-50 sm:text-sm' : 'shrink-0 text-sm font-semibold text-[#006b80] hover:text-[#005466]'}
        >
          View all
        </Link>
      </div>

      {/* Category carousel or popular category grid */}
      <div className="relative w-full">
        {activeCategories.length > 0 ? (
          variant === 'popular' ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {visibleCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buyer?category=${encodeURIComponent(category.name.toLowerCase())}#products`}
                  aria-label={`Browse ${category.name} listings`}
                  className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:border-cyan-300 hover:bg-cyan-50/50 sm:p-3"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cyan-50 sm:h-14 sm:w-14">
                    <CategoryImage name={category.name} imageUrl={category.image_url} rounded={false} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-[#006b80]">{category.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">View listings</span>
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#006b80] transition-colors group-hover:bg-[#006b80] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative group/carousel">
              {canScrollLeft && (
                <button onClick={() => scroll('left')} aria-label="Scroll categories left" className="absolute -left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-cyan-600 hover:text-white sm:-left-4">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="scrollbar-hide flex touch-pan-x overscroll-x-contain snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth sm:gap-6"
              >
                {visibleCategories.map((category, index) => (
                  <Link key={category.id} href={`/buyer?category=${encodeURIComponent(category.name.toLowerCase())}#products`} className="group flex w-[76px] shrink-0 snap-start flex-col items-center gap-2 transition-all sm:w-[88px]">
                    <span className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-sm transition-shadow group-hover:shadow-md">
                      <CategoryImage name={category.name} imageUrl={category.image_url} priority={prioritizeFirstImage && index === 0} />
                    </span>
                    <span className="w-full truncate text-center text-xs font-semibold text-slate-700 transition-colors group-hover:text-[#006b80]">{category.name}</span>
                  </Link>
                ))}
              </div>
              {canScrollRight && (
                <button onClick={() => scroll('right')} aria-label="Scroll categories right" className="absolute -right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-md transition hover:bg-cyan-600 hover:text-white sm:-right-4">
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )
        ) : (
          <div className="w-full rounded-3xl border border-dashed border-slate-300 bg-white/60 backdrop-blur-md px-6 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
            No active categories available.
          </div>
        )}
      </div>
    </section>
  );
}
