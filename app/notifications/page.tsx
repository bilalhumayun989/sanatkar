'use client';

import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
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

interface ChatNotification {
  chatId: string;
  senderName: string;
  listingTitle: string;
  content: string;
  createdAt: string;
  unreadCount: number;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatNotifications, setChatNotifications] = useState<ChatNotification[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
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

      const { error: markViewedError } = await supabase
        .from('offers')
        .update({ status: 'viewed' })
        .eq('seller_id', user.id)
        .eq('status', 'pending');

      if (markViewedError) {
        console.error('Failed to mark offers as viewed:', markViewedError);
      }

      const { data: chats } = await supabase
        .from('chats')
        .select('id, buyer_id, seller_id, listings:listing_id (title)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      const unreadChats = await Promise.all((chats || []).map(async (chat: any) => {
        const { data: latest } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('chat_id', chat.id)
          .neq('sender_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!latest) return null;

        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);
        const otherUserId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
        const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', otherUserId).maybeSingle();
        const listing = Array.isArray(chat.listings) ? chat.listings[0] : chat.listings;
        return {
          chatId: chat.id,
          senderName: profile?.full_name || profile?.username || 'New message',
          listingTitle: listing?.title || 'Conversation',
          content: latest.content || 'Sent a message',
          createdAt: latest.created_at,
          unreadCount: count || 0,
        } as ChatNotification;
      }));
      setChatNotifications(unreadChats.filter(Boolean) as ChatNotification[]);
      setLoading(false);
    }

    fetchNotifications();
  }, [user]);

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'viewed':
      case 'pending':
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEFF9] text-slate-800 pb-20">
      {/* Top Title Bar */}
      {/* <div className="bg-[#13BDC4] text-white px-4 py-3 flex items-center space-x-3 shadow-md sticky top-0 z-10">
        <Link href="/" className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-base font-semibold">Notifications & Offers</h1>
      </div> */}

      {/* Offers Content List */}
      <div className="p-4 max-w-2xl mx-auto mt-28">
        {loading ? (
          <div className="text-center py-2 text-slate-500 text-sm font-medium">
            Loading offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[#13BDC4]/60" />
            </div>
            <p className="text-slate-600 text-base font-semibold">No new notifications.</p>
            <p className="text-slate-400 text-xs mt-1">
              New messages and offers will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {chatNotifications.map((notification) => (
              <Link key={notification.chatId} href={`/messages?chat=${encodeURIComponent(notification.chatId)}`} className="group rounded-xl border border-rose-100 bg-white p-4 shadow-sm transition hover:border-rose-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><MessageSquare size={18} /></div>
                    <div className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-rose-500">New chat message</span><h3 className="mt-1 truncate text-sm font-bold text-slate-800">{notification.senderName}</h3><p className="truncate text-xs text-slate-500">{notification.content}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{notification.listingTitle} · {new Date(notification.createdAt).toLocaleString()}</p></div>
                  </div>
                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 px-2 text-[10px] font-black text-white">{notification.unreadCount}</span>
                </div>
              </Link>
            ))}
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