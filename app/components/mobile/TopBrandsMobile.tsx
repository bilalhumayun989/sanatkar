'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/auth/supabase/client';
import { useLanguage } from '@/lib/LanguageContext';

interface Brand {
  id: string;
  name: string;
  logo_url?: string | null;
  is_active?: boolean;
}

export default function TopBrandsMobile() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrands() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setBrands(data);
      }
      setLoading(false);
    }

    fetchBrands();
  }, []);

  return (
    <div className="w-full px-4 my-3 lg:hidden bg-[#EAEFF9]">
      <div className="bg-[#EAEFF9] rounded-2xl p-2">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{t('top_brands')}</h3>
          <Link
            href="/brands"
            className="text-xs font-semibold text-[#13BDC4] hover:underline"
          >
            View all
          </Link>
        </div>

         {/* Brands Horizontal Scroll View */}
        <div className="brands-scroll   flex items-center gap-2.5 overflow-x-auto overscroll-x-contain py-1">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="w-20 h-12 bg-slate-100 animate-pulse rounded-2xl shrink-0"
              />
            ))
          ) : brands.length > 0 ? (
            brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="h-12 px-4 bg-[#f4fafb] hover:bg-[#e6f5f7] border border-[#e1f2f4] rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-95"
              >
                {brand.logo_url ? (
                  <div className="relative w-14 h-7">
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wide whitespace-nowrap">
                    {brand.name}
                  </span>
                )}
              </Link>
            ))
          ) : (
            <span className="text-xs text-slate-400">No brands found</span>
          )}
        </div>

        <style jsx>{`
  .brands-scroll {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .brands-scroll::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
`}</style>
      </div>
    </div>
  );
}
