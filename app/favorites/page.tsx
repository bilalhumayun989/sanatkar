'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Trash2, Tag } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';

interface FavoriteItem {
  id: string;
  listing_id: string;
  listings: {
    id: string;
    title: string;
    price: number;
    image_urls?: string[];
  } | null;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (!user) {
        setLoading(false);
        return;
      }
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          listing_id,
          listings!inner (
            id,
            title,
            price,
            image_urls
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Favorites Fetch Error:', error.message);
      } else if (data) {
        setFavorites(data as unknown as FavoriteItem[]);
      }
      setLoading(false);
    }

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (favId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('favorites').delete().eq('id', favId);
    if (!error) {
      setFavorites(favorites.filter((item) => item.id !== favId));
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF9] text-black pt-[30px] pb-20">
     

      {/* Favorites List */}
      <div className="p-4 max-w-2xl mx-auto py-25">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            Loading favorites...
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <Tag className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">No saved items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-xs text-slate-400">
                    {fav.listings?.image_urls?.[0] ? (
                      <img
                        src={fav.listings.image_urls[0]}
                        alt={fav.listings.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      'No Image'
                    )}
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-bold text-slate-800 truncate">
                      {fav.listings?.title || 'Untitled Item'}
                    </h3>
                    <p className="text-xs font-semibold text-[#13BDC4] mt-1">
                      ${fav.listings?.price?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeFavorite(fav.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}