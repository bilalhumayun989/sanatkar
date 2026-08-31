'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';

interface OfferItem {
  id: string;
  offer_price: number;
  status: string;
  created_at: string;
  listings: {
    title: string;
  };
  buyer: {
    full_name: string;
    username: string;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      if (!user) {
        setLoading(false);
        return;
      }
      const supabase = createClient();

      const { data: offersData } = await supabase
        .from('offers')
        .select(`
          id,
          offer_price,
          status,
          created_at,
          listings (
            title
          ),
          buyer:buyer_id (
            full_name,
            username
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (offersData) {
        setOffers(offersData as unknown as OfferItem[]);
      }

      setLoading(false);
    }

    fetchOffers();
  }, [user]);

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Title Bar */}
      {/* <div className="bg-[#13BDC4] text-white px-4 py-3 flex items-center space-x-3 shadow-md sticky top-0 z-10">
        <Link href="/" className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-base font-semibold">Notifications & Offers</h1>
      </div> */}

      {/* Offers Content List */}
      <div className="p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-medium">
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#13BDC4]/60" />
            </div>
            <p className="text-slate-600 text-base font-semibold">No offers received yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              When buyers send offers on your ads, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-[#13BDC4] uppercase bg-cyan-50 px-2 py-0.5 rounded">
                      Offer Received
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 mt-1">
                      {offer.listings?.title || 'Listing Item'}
                    </h3>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">
                    ${offer.offer_price?.toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Offered by:{' '}
                  <span className="font-semibold text-slate-700">
                    {offer.buyer?.full_name || offer.buyer?.username || 'Buyer'}
                  </span>
                </p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                  <span className="text-xs text-slate-400">Status</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getStatusBadgeClass(
                      offer.status
                    )}`}
                  >
                    {offer.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}