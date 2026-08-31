'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import PartCard from '@/app/components/features/PartCard';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';
import { Loader2, Package } from 'lucide-react';
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
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSaved = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: favorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('id, listing_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (favoritesError) {
          setError('Unable to load saved listings.');
          setSavedListings([]);
          return;
        }

        if (!Array.isArray(favorites) || favorites.length === 0) {
          setSavedListings([]);
          return;
        }

        const listingIds = favorites.map((fav: any) => fav.listing_id).filter(Boolean);
        if (listingIds.length === 0) {
          setSavedListings([]);
          return;
        }

        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, brand, category, price, location, image_urls, condition, status, created_at')
          .in('id', listingIds)
          .order('created_at', { ascending: false });

        if (listingsError || !Array.isArray(listings)) {
          setError('Unable to load saved listings.');
          setSavedListings([]);
          return;
        }

        const listingMap = new Map(listings.map((item: any) => [item.id, item]));
        const mapped = favorites
          .map((fav: any) => {
            const listing = listingMap.get(fav.listing_id);
            if (!listing) return null;
            return {
              id: fav.id,
              favoriteId: fav.id,
              listing_id: fav.listing_id,
              title: listing.title,
              brand: listing.brand || 'Unknown',
              price: Number(listing.price) || 0,
              location: listing.location || 'Pakistan',
              image_urls: listing.image_urls || [],
              condition: listing.condition || 'New',
              category: listing.category || 'General',
              status: listing.status || 'active',
              created_at: listing.created_at,
            };
          })
          .filter(Boolean) as SavedListing[];

        setSavedListings(mapped);
      } catch (err) {
        console.error('Saved listings load failed', err);
        setError('Unable to load saved listings.');
      } finally {
        setLoading(false);
      }
    };

    loadSaved();
  }, [authLoading, user]);

  const handleUnsave = (listingId: string) => {
    setSavedListings((prev) => prev.filter((item) => item.listing_id !== listingId));
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-black">
      <Navbar forceSolid />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Saved Listings</p>
            <h1 className="text-3xl font-black text-gray-900">My Saved Ads</h1>
          </div>
          <Link href="/buyer" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">Browse marketplace</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-gray-200 bg-white p-10">
            <Loader2 className="mr-3 animate-spin text-primary" size={20} />
            <span className="text-sm font-semibold text-gray-600">Loading saved listings…</span>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : savedListings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
            You have no saved listings yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((listing) => (
              <PartCard
                key={listing.id}
                part={{
                  id: listing.listing_id,
                  brand: listing.brand,
                  partName: listing.title,
                  price: listing.price,
                  location: listing.location,
                  image: Array.isArray(listing.image_urls) && listing.image_urls[0] ? listing.image_urls[0] : '/hero.jpg',
                  compatibility: 'Universal',
                  condition: listing.condition,
                  stockStatus: listing.status === 'active' ? 'In Stock' : 'Unavailable',
                  category: listing.category,
                  sellerId: '',
                  sellerName: '',
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
