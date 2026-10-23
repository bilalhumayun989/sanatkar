'use client';

import { refreshOnRealtime } from '@/lib/realtime/client';

import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

interface OfferItem {
  id: string;
  offer_price: number;
  status: string;
  created_at: string | null;
  listing?: {
    title: string;
  } | null;
  buyer?: {
    full_name: string | null;
    username: string | null;
  } | null;
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

      try {
        const response = await fetch('/api/notifications', { credentials: 'include' });
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.message || 'Unable to load notifications.');
        }
        setOffers((json.offers || []) as OfferItem[]);
        setChatNotifications((json.chat_notifications || []) as ChatNotification[]);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        setOffers([]);
        setChatNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchNotifications();
    if (!user) return;
    const unsubscribe = refreshOnRealtime(['notifications', 'chats'], fetchNotifications);
    void fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    return unsubscribe;
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
      <div className="p-4 max-w-2xl mx-auto mt-28">
        {loading ? (
          <div className="text-center py-2 text-slate-500 text-sm font-medium">
            Loading offers...
          </div>
        ) : offers.length === 0 && chatNotifications.length === 0 ? (
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
                      {offer.listing?.title || 'Listing Item'}
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