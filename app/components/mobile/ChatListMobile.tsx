'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';

interface ChatItem {
  id: string;
  created_at: string;
  updated_at: string;
  buyer_id: string;
  seller_id: string;
  listing: {
    id: string;
    title: string;
    brand: string | null;
    image_urls: string[];
  } | null;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  senderName: string;
}

export default function ChatListMobile() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadChats = async () => {
      try {
        const [meResponse, chatsResponse] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }),
          fetch('/api/chats', { cache: 'no-store' }),
        ]);
        const [me, result] = await Promise.all([meResponse.json(), chatsResponse.json()]);
        if (!meResponse.ok || !me.success || !me.user) {
          if (active) setLoading(false);
          return;
        }
        if (!chatsResponse.ok || !result.success || !Array.isArray(result.chats)) {
          throw new Error(result.message || 'Unable to load conversations.');
        }
        if (!active) return;
        setChats(result.chats.map((chat: any) => {
          const latest = chat.latestMessage;
          return {
            id: chat.id,
            created_at: chat.created_at || new Date().toISOString(),
            updated_at: chat.updated_at || chat.created_at || new Date().toISOString(),
            buyer_id: chat.buyer_id,
            seller_id: chat.seller_id,
            listing: chat.listing,
            lastMessage: latest?.content || 'No messages yet',
            lastMessageDate: new Date(latest?.created_at || chat.updated_at || chat.created_at || Date.now()).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'numeric', year: '2-digit',
            }),
            unreadCount: Number(chat.unreadCount) || 0,
            senderName: latest?.sender_id === me.user.id
              ? 'You'
              : chat.otherUser?.username || chat.otherUser?.full_name || 'User',
          };
        }));
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadChats();
    const interval = window.setInterval(() => { void loadChats(); }, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredChats = chats.filter((chat) => {
    const title = chat.listing?.title?.toLowerCase() || '';
    const brand = chat.listing?.brand?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || brand.includes(query);
  });

  return (
    <div className="w-full min-h-screen bg-[#EAEFF9] lg:hidden pb-10">
      {/* Header */}
      <div className="bg-[#13BDC4] text-white pt-5 pb-8 px-4  shadow-sm relative">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div>
            <div className="text-base font-bold leading-tight">Chats</div>
            <p className="text-[11px] text-white/80 font-medium">
              {chats.length} active conversations
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-3">
       

        {/* Chat Items / Skeleton */}
        <div className="space-y-2.5 pt-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 text-[#13BDC4] animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Loading conversations...</span>
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/messages?chat=${encodeURIComponent(chat.id)}`}
                className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/80 active:scale-[0.99] transition-transform block"
              >
                {/* Machine Image */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                  <Image
                    src={chat.listing?.image_urls?.[0] || '/placeholder-machine.jpg'}
                    alt={chat.listing?.title || 'Machine'}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-800 truncate">
                      {chat.listing?.title || 'Untitled Listing'}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {chat.lastMessageDate}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium -mt-0.5">
                    {chat.listing?.brand || 'Machine'}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[11px] text-slate-500 truncate font-normal">
                      <span className="font-bold text-slate-700 mr-1">{chat.senderName}:</span>
                      {chat.lastMessage}
                    </p>

                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 text-xs text-slate-400">
              No conversations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}