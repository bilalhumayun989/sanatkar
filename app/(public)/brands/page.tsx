'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { ArrowLeft, Search, SlidersHorizontal, Loader2, Package } from 'lucide-react';
import PartCard from '@/app/components/features/PartCard';

interface Brand {
  id: string;
  name: string;
  logo_url?: string | null;
}

interface Listing {
  id: string;
  title: string;
  brand: string;
  make?: string;
  model?: string;
  price: number;
  location: string;
  city?: string;
  image_urls: string[];
  condition?: string;
  category: string;
  status: string;
  created_at: string;
}

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch('/api/brands', { cache: 'no-store' });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.brands)) setBrands(result.brands as Brand[]);
      } catch (error) {
        console.error('Failed to fetch brands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings?limit=200', { cache: 'no-store' });
        const result = await response.json();
        if (response.ok && result.success && Array.isArray(result.data)) setListings(result.data as Listing[]);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (selectedBrand) {
      result = result.filter((item) => (item.brand || item.make || '').toLowerCase() === selectedBrand.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const text = `${item.title || ''} ${item.brand || ''} ${item.make || ''} ${item.model || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return result;
  }, [listings, selectedBrand, searchQuery]);

  const mappedListings = filteredListings.map((listing) => ({
    id: listing.id,
    brand: listing.brand || listing.make || 'Unknown',
    partName: listing.title || `${listing.make || ''} ${listing.model || ''}`.trim() || 'Listing',
    price: Number(listing.price) || 0,
    location: listing.location || listing.city || 'Pakistan',
    image: Array.isArray(listing.image_urls) && listing.image_urls[0]
      ? listing.image_urls[0]
      : '/hero.jpg',
    compatibility: 'Universal',
    condition: listing.condition || 'New',
    stockStatus: 'In Stock',
    isFeatured: listing.status === 'active',
    sellerRole: null,
    sellerId: null,
    sellerName: null,
    category: listing.category || 'General',
    createdAt: listing.created_at || new Date().toISOString(),
  }));

  if (!selectedBrand) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-30 pb-14 lg:pt-24">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#13BDC4]">Marketplace</p>
              <h1 className="text-2xl font-black text-slate-900">Select a Brand</h1>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(brand.name)}
                  className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#13BDC4]/40"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-10 w-auto object-contain" />
                  ) : (
                    <span className="text-sm font-black uppercase tracking-wide text-slate-700">{brand.name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <div className="container-wide py-16 md:py-8 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedBrand(null)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#13BDC4]">Brand Results</p>
            <h1 className="text-2xl font-black text-slate-900">{selectedBrand}</h1>
          </div>
        </div>

        <div className="relative group mb-6 md:mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#13BDC4] transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${selectedBrand}...`}
            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/20"
          />
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-slate-900">
            Results <span className="text-slate-400">({mappedListings.length})</span>
          </h2>
          <button className="flex items-center gap-2 text-sm font-bold text-[#13BDC4]">
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#13BDC4] animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading</p>
          </div>
        ) : mappedListings.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 text-slate-500 px-10 py-12 rounded-3xl text-center">
            <Package size={40} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-slate-900">No listings found</h3>
            <p className="font-medium">Try searching with different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {mappedListings.map((listing) => (
              <PartCard key={listing.id} part={listing as any} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
