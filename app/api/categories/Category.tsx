'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface Category {
  id: string;
  name: string;
  image_url?: string | null;
  description?: string;
  is_active?: boolean;
}

const CategoryImage = ({ 
  name, 
  imageUrl 
}: { 
  name: string; 
  imageUrl?: string | null;
}) => {
  const [imageError, setImageError] = useState(false);

  // If image_url exists and hasn't failed to load
  if (imageUrl && imageUrl.trim() !== '' && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-110"
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: Display first letter of category name if image is missing or broken
  return (
    <div className="flex items-center justify-center w-full h-full text-cyan-600 font-black text-2xl sm:text-3xl uppercase transition-transform duration-300 group-hover:scale-110 select-none">
      {name.charAt(0)}
    </div>
  );
};

export default function CategoriesSection({ categories = [] }: { categories: Category[] }) {
  const { t } = useLanguage();
  const activeCategories = categories.filter((cat) => cat.is_active !== false);
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
    <section className="container-wide py-10 md:py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 md:mb-12 gap-4">
        <div className="text-left max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-600 shadow-sm mb-3">
            {t('shop_by_category')}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            {t('browse_categories')}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {t('browse_categories_desc')}
          </p>
        </div>

        <Link
          href="/buyer"
          className="self-start md:self-auto inline-flex items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          View Marketplace
        </Link>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative group/carousel w-full">
        {activeCategories.length > 0 ? (
          <>
            {/* Conditional Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll Left"
                className="absolute -left-3 sm:-left-5 top-12 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-cyan-600 hover:text-white hover:border-cyan-600 hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Single Line Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="flex items-start gap-6 sm:gap-10 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
            >
              {activeCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buyer?category=${encodeURIComponent(category.name.toLowerCase())}`}
                  className="group flex flex-col items-center gap-3 shrink-0 snap-start transition-all"
                >
                  <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-slate-100/80 border border-slate-200/80 shadow-sm transition-all duration-300 group-hover:bg-cyan-500/10 group-hover:border-cyan-400 group-hover:shadow-md group-hover:-translate-y-1 overflow-hidden">
                    <CategoryImage 
                      name={category.name} 
                      imageUrl={category.image_url}
                    />
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-slate-800 text-center tracking-tight transition-colors group-hover:text-cyan-600 max-w-[110px] line-clamp-2">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Conditional Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll Right"
                className="absolute -right-3 sm:-right-5 top-12 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/90 border border-slate-200 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-cyan-600 hover:text-white hover:border-cyan-600 hover:scale-110 active:scale-95"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full rounded-3xl border border-dashed border-slate-300 bg-white/60 backdrop-blur-md px-6 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
            No active categories available.
          </div>
        )}
      </div>
    </section>
  );
}