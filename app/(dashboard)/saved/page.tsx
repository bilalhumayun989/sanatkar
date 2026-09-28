'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { createClient } from '@/lib/auth/supabase/client';
import { Loader2, Bookmark, Heart, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SavedListing {
  id: string;
  favoriteId?: string;
  listing_id: string;
  title: string;
  brand: string;
  price: number;
  location: string;
  image_urls: string[];
  condition: string;
  category: string;
  status: string;
  created_at: string;
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    const loadSaved = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites').select('id, listing_id').eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (favoritesError) { setError(t('unable_load_saved')); setSavedListings([]); return; }
        if (!Array.isArray(favorites) || favorites.length === 0) { setSavedListings([]); return; }

        const listingIds = favorites.map((f: any) => f.listing_id).filter(Boolean);
        if (listingIds.length === 0) { setSavedListings([]); return; }

        const { data: listings, error: listingsError } = await supabase
          .from('listings').select('id, title, brand, category, price, location, image_urls, condition, status, created_at')
          .in('id', listingIds).order('created_at', { ascending: false });

        if (listingsError || !Array.isArray(listings)) { setError(t('unable_load_saved')); setSavedListings([]); return; }

        const listingMap = new Map(listings.map((item: any) => [item.id, item]));
        const mapped = favorites.map((fav: any) => {
          const listing = listingMap.get(fav.listing_id);
          if (!listing) return null;
          return {
            id: fav.id, favoriteId: fav.id, listing_id: fav.listing_id,
            title: listing.title, brand: listing.brand || 'Unknown',
            price: Number(listing.price) || 0, location: listing.location || 'Pakistan',
            image_urls: listing.image_urls || [], condition: listing.condition || 'New',
            category: listing.category || 'General', status: listing.status || 'active',
            created_at: listing.created_at,
          };
        }).filter(Boolean) as SavedListing[];

        setSavedListings(mapped);
      } catch (err) {
        console.error('Saved listings load failed', err);
        setError(t('unable_load_saved'));
      } finally {
        setLoading(false);
      }
    };
    loadSaved();
  }, [authLoading, user]);

  const handleUnsave = (listingId: string) => {
    setSavedListings(prev => prev.filter(item => item.listing_id !== listingId));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <Navbar forceSolid />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20 pt-32">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
              <Bookmark size={14} /> {t('wishlist')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{t('saved_listings')}</h1>
          </div>
          <Link href="/buyer"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark hover:shadow-primary/30 transition-all duration-200 active:scale-95 shrink-0">
            {t('browse_marketplace')} <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <Loader2 className="mb-4 animate-spin text-primary" size={32} />
            <span className="text-base font-bold text-slate-700">{t('loading_saved')}</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-sm font-semibold text-rose-800 shadow-sm">
            <AlertCircle className="text-rose-600 shrink-0" size={20} />
            <span>{error}</span>
          </div>
        ) : savedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{t('no_saved_yet')}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">{t('no_saved_desc')}</p>
            <Link href="/buyer"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-all">
              {t('explore_products')}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map(listing => (
              <PartCard
                key={listing.id}
                part={{
                  id: listing.listing_id, brand: listing.brand, partName: listing.title,
                  price: listing.price, location: listing.location,
                  image: Array.isArray(listing.image_urls) && listing.image_urls[0] ? listing.image_urls[0] : '/hero.jpg',
                  compatibility: 'Universal', condition: listing.condition,
                  stockStatus: listing.status === 'active' ? 'In Stock' : 'Unavailable',
                  category: listing.category, sellerId: '', sellerName: '',
                }}
                onUnsave={() => handleUnsave(listing.listing_id)}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
