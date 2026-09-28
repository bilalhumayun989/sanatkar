'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase/client';
import Link from 'next/link';
import { 
  MessageSquare, Loader2, User, Search, Circle, 
  ArrowUpRight, Tag, DollarSign, Clock, ChevronRight, Inbox
} from 'lucide-react';
import ChatListMobile from '@/app/components/mobile/ChatListMobile';

interface ListingInfo {
  id: string;
  title?: string;
  brand?: string;
  image_urls?: string[];
  price?: number | string;
  make?: string;
}

interface OtherUser {
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

interface LatestMessage {
  content?: string;
  created_at?: string;
  is_read?: boolean;
  sender_id?: string;
  type?: string;
  offer_amount?: number | string | null;
}

interface ChatRecord {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings?: ListingInfo[] | null;
  otherUser?: OtherUser;
  latestMessage?: LatestMessage | null;
}

export default function MessagesInboxPage() {
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateView = () => setIsMobileView(window.innerWidth < 1024);
    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/login?next=/messages';
          return;
        }
        setCurrentUserId(user.id);

        const { data, error } = await supabase
          .from('chats')
          .select(`
            id,
            created_at,
            buyer_id,
            seller_id,
            listings:listing_id (id, title, brand, image_urls, price)
          `)
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching chats:', error);
        } else if (data) {
          const enhancedChats = await Promise.all(data.map(async (chat) => {
            const otherUserId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', otherUserId)
              .maybeSingle();

            const { data: latestMessage } = await supabase
              .from('messages')
              .select('content, created_at, is_read, sender_id, type, offer_amount')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...chat,
              otherUser: profile || { username: 'Unknown User' },
              latestMessage
            };
          }));
          setChats(enhancedChats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (isMobileView) {
    return <ChatListMobile />;
  }

  const filteredChats = chats.filter(chat => {
    const otherName = chat.otherUser?.username || chat.otherUser?.full_name || '';
    const listing = Array.isArray(chat.listings) ? chat.listings[0] : chat.listings;
    const listingTitle = listing?.title || listing?.brand || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           listingTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Conversations...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 sm:pt-28 pb-16 min-h-screen bg-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Inbox size={14} className="text-primary" />
              <span>Communication Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Messages & Offers</h1>
          </div>

          <Link 
            href="/buyer" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-primary font-bold text-xs uppercase tracking-wider shadow-sm hover:border-slate-300 transition-all active:scale-[0.98] w-fit"
          >
            Explore Marketplace <ArrowUpRight size={15} />
          </Link>
        </div>

        {chats.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center border border-slate-200/60 shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <MessageSquare size={32} className="text-slate-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">No messages yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-xs sm:text-sm font-medium leading-relaxed">
              When you submit offers or receive queries on your equipment listings, your ongoing discussions will show up here.
            </p>
            <Link 
              href="/buyer" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          /* Active Chat Container */
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
            
            {/* Search Bar Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="relative flex-grow max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by user or product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block ml-auto">
                {filteredChats.length} {filteredChats.length === 1 ? 'Conversation' : 'Conversations'}
              </span>
            </div>

            {/* List Items */}
            <div className="divide-y divide-slate-100">
              {filteredChats.map((chat) => {
                const listing = Array.isArray(chat.listings) ? chat.listings[0] ?? null : chat.listings ?? null;
                const listingTitle = listing?.title || listing?.make || listing?.brand || 'Machine Part';
                const listingImg = listing?.image_urls?.[0];
                const isUnread = chat.latestMessage && !chat.latestMessage.is_read && chat.latestMessage.sender_id !== currentUserId;
                const isOffer = chat.latestMessage?.type === 'offer';
                const senderDisplayName = chat.latestMessage?.sender_id === currentUserId
                  ? 'You'
                  : chat.otherUser?.username || chat.otherUser?.full_name || 'User';

                return (
                  <Link 
                    key={chat.id} 
                    href={`/messages/${chat.id}`}
                    className={`group relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 transition-all duration-200 hover:bg-slate-50/80 ${
                      isUnread ? 'bg-primary/[0.02]' : ''
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                    )}

                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:border-primary/40 transition-colors">
                        {chat.otherUser?.avatar_url ? (
                          <img src={chat.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-slate-400" />
                        )}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Chat Overview */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm sm:text-base truncate group-hover:text-primary transition-colors ${
                          isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                        }`}>
                          {chat.otherUser?.username || chat.otherUser?.full_name || (chat.buyer_id === currentUserId ? 'Seller' : 'Buyer')}
                        </h3>
                        
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 shrink-0">
                          <Clock size={12} />
                          {chat.latestMessage?.created_at 
                            ? new Date(chat.latestMessage.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                            : ''}
                        </div>
                      </div>

                      {/* Listing Badge */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 mb-1.5 max-w-full truncate border border-slate-200/50">
                        <Tag size={12} className="text-primary shrink-0" />
                        <span className="truncate">Re: {listingTitle}</span>
                      </div>

                      {/* Message Preview */}
                      <div className="flex items-center gap-2">
                        {isOffer ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 shrink-0">
                            <DollarSign size={13} />
                            Offer: PKR {Number(chat.latestMessage?.offer_amount || 0).toLocaleString()}
                          </span>
                        ) : (
                          <p className={`text-xs sm:text-sm truncate ${
                            isUnread ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'
                          }`}>
                            <span className="font-bold text-slate-700 mr-1">{senderDisplayName}:</span>
                            {chat.latestMessage?.content || 'No messages yet'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Listing Thumbnail Side Indicator */}
                    {listingImg ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 hidden sm:block">
                        <img src={listingImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}