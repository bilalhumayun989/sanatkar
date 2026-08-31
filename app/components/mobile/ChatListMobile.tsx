'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface ChatItem {
  id: string;
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    brand: string | null;
    image_urls: string[];
  } | null;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export default function ChatListMobile() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserChats() {
      const supabase = createClient();

      // Current User Check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Fetch chats with relational listings
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          updated_at,
          listing:listings (
            id,
            title,
            brand,
            image_urls
          )
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (chatsError || !chatsData) {
        console.error('Error fetching chats:', chatsError);
        setLoading(false);
        return;
      }

      // 2. Fetch last message & unread count for each chat
      type ChatRow = {
        id: string;
        created_at: string;
        updated_at: string;
        listing: {
          id: string;
          title: string;
          brand: string | null;
          image_urls: string[];
        } | null | Array<{
          id: string;
          title: string;
          brand: string | null;
          image_urls: string[];
        }>;
      };

      const formattedChats: ChatItem[] = await Promise.all(
        chatsData.map(async (chat: ChatRow) => {
          // Fetch last message
          const { data: msgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Fetch unread count for current user
          const { count: unread } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          const formattedDate = msgData?.created_at
            ? new Date(msgData.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: '2-digit',
              })
            : new Date(chat.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'numeric',
                year: '2-digit',
              });

          return {
            id: chat.id,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            listing: Array.isArray(chat.listing) ? chat.listing[0] : chat.listing,
            lastMessage: msgData?.content || 'No messages yet',
            lastMessageDate: formattedDate,
            unreadCount: unread || 0,
          };
        })
      );

      setChats(formattedChats);
      setLoading(false);
    }

    fetchUserChats();
  }, []);

  const filteredChats = chats.filter((chat) => {
    const title = chat.listing?.title?.toLowerCase() || '';
    const brand = chat.listing?.brand?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query) || brand.includes(query);
  });

  return (
    <div className="w-full min-h-screen bg-[#F6FBFC] lg:hidden pb-10">
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
                href={`/messages/${chat.id}`}
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
                      {chat.lastMessage}
                    </p>

                    {chat.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#13BDC4] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
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