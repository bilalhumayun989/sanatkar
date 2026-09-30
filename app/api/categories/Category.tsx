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

export default function CategoriesSection({ categories = [], title }: { categories: Category[]; title?: string }) {
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
    <section className="container-wide py-2 md:py-3 lg:!mx-0 lg:!max-w-none lg:!px-0">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title || t('browse_categories')}</h2>
        <Link
          href="/buyer"
          className="shrink-0 text-sm font-semibold text-[#079bb5] hover:text-[#087c91]"
        >
          View all
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
              className="flex items-start gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden sm:gap-6"
            >
              {activeCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buyer?category=${encodeURIComponent(category.name.toLowerCase())}#products`}
                  className="group flex w-[76px] flex-col items-center gap-2 shrink-0 snap-start transition-all sm:w-[88px]"
                >
                  <div className="relative flex aspect-square w-full items-center justify-center rounded-full bg-white border-2 border-[#13bdc4] transition-all duration-200 group-hover:shadow-sm overflow-hidden">
                    <CategoryImage 
                      name={category.name} 
                      imageUrl={category.image_url}
                    />
                  </div>

                  <span className="w-full truncate text-xs font-semibold text-slate-700 text-center transition-colors group-hover:text-[#079bb5]">
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