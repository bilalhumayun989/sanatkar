'use client';

import { Suspense, useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase/client';
import Link from 'next/link';
import { 
  MessageSquare, Loader2, User, Search, Circle, 
  ArrowUpRight, Tag, DollarSign, Clock, ChevronRight, Inbox, Send, MoreVertical, Plus, CheckCheck
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import ChatRoomMobile from '@/app/components/mobile/ChatRoomMobile';
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
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string | null;
  created_at: string;
  is_read?: boolean;
  type?: string;
  offer_amount?: number | string | null;
}

export default function MessagesPage() {
  return <Suspense fallback={<div className="p-12 text-center">Loading messages...</div>}><MessagesInboxPage /></Suspense>;
}

function MessagesInboxPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedChatId = searchParams.get('chat');
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

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
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
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

            const { count: unreadCount } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .neq('sender_id', user.id)
              .eq('is_read', false);

            return {
              ...chat,
              otherUser: profile || { username: 'Unknown User' },
              latestMessage,
              unreadCount: unreadCount || 0,
            };
          }));
          setChats(enhancedChats);
          const targetChat = new URLSearchParams(window.location.search).get('chat');
          setSelectedChatId(targetChat ? enhancedChats.find(chat => chat.id === targetChat)?.id || null : enhancedChats[0]?.id || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (requestedChatId) setSelectedChatId(chats.some(chat => chat.id === requestedChatId) ? requestedChatId : null);
  }, [requestedChatId, chats]);

  useEffect(() => {
    if (!selectedChatId || !currentUserId) { setActiveMessages([]); return; }
    let active = true;
    setActiveMessages([]);

    const loadActiveChat = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('id, chat_id, sender_id, content, created_at, is_read, type, offer_amount')
        .eq('chat_id', selectedChatId)
        .order('created_at', { ascending: true });

      if (!active) return;
      const messages = (data || []) as ChatMessage[];
      setActiveMessages(messages);
      const unreadIds = messages.filter(message => message.sender_id !== currentUserId && !message.is_read).map(message => message.id);
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
        setChats(previous => previous.map(chat => chat.id === selectedChatId && chat.latestMessage
          ? { ...chat, unreadCount: 0, latestMessage: { ...chat.latestMessage, is_read: true } }
          : chat));
      }
    };

    loadActiveChat().catch(error => console.error('Active chat load failed:', error));
    return () => { active = false; };
  }, [selectedChatId, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`inbox_${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const incoming = payload.new as ChatMessage;
        const isMine = incoming.sender_id === currentUserId;
        const isActiveChat = incoming.chat_id === selectedChatId;

        setChats(previous => previous.map(chat => chat.id === incoming.chat_id
          ? {
              ...chat,
              unreadCount: isMine || isActiveChat ? 0 : (chat.unreadCount || 0) + 1,
              latestMessage: {
                ...chat.latestMessage,
                content: incoming.content || '',
                created_at: incoming.created_at,
                sender_id: incoming.sender_id,
                is_read: isMine || isActiveChat,
                type: incoming.type,
                offer_amount: incoming.offer_amount,
              },
            }
          : chat));

        if (isActiveChat) {
          setActiveMessages(previous => previous.some(message => message.id === incoming.id) ? previous : [...previous, incoming]);
          if (!isMine) {
            void supabase.from('messages').update({ is_read: true }).eq('id', incoming.id);
          }
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId, selectedChatId]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedChatId || !currentUserId || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('messages').insert({
        chat_id: selectedChatId,
        sender_id: currentUserId,
        content,
        type: 'text',
      }).select().single();
      if (error) throw error;
      setActiveMessages(previous => [...previous, data as ChatMessage]);
      setChats(previous => previous.map(chat => chat.id === selectedChatId
        ? { ...chat, unreadCount: 0, latestMessage: { content, created_at: data.created_at, sender_id: currentUserId, is_read: true, type: 'text' } }
        : chat));
    } catch (error) {
      console.error('Message send failed:', error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  if (isMobileView) {
    return requestedChatId ? <ChatRoomMobile key={requestedChatId} chatId={requestedChatId} /> : <ChatListMobile />;
  }

  const filteredChats = chats.filter(chat => {
    const otherName = chat.otherUser?.username || chat.otherUser?.full_name || '';
    const listing = Array.isArray(chat.listings) ? chat.listings[0] : chat.listings;
    const listingTitle = listing?.title || listing?.brand || '';
    return otherName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           listingTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const selectedChat = chats.find(chat => chat.id === selectedChatId) || null;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Conversations...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#F8FAFC] pt-4 pb-0 sm:pt-5">
      <div className="flex h-full min-h-0 w-full flex-col px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Section */}
        <div className="flex shrink-0 flex-col justify-between gap-4 pb-5 sm:flex-row sm:items-center">
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
          <>
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,360px)_1fr] overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Inbox</p><h2 className="text-lg font-black text-slate-900">Chats</h2></div>
                  <Link href="/buyer" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[11px] font-black text-white shadow-md shadow-primary/20 hover:bg-primary-dark"><Plus size={14} /> New Chat</Link>
                </div>
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search chats" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredChats.map((chat) => {
                  const listing = Array.isArray(chat.listings) ? chat.listings[0] ?? null : chat.listings ?? null;
                  const name = chat.otherUser?.username || chat.otherUser?.full_name || (chat.buyer_id === currentUserId ? 'Seller' : 'Buyer');
                  const isUnread = (chat.unreadCount || 0) > 0;
                  const isSelected = chat.id === selectedChatId;
                  const time = chat.latestMessage?.created_at ? new Date(chat.latestMessage.created_at) : null;
                  return (
                    <button key={chat.id} type="button" onClick={() => { setSelectedChatId(chat.id); router.replace('/messages?chat=' + encodeURIComponent(chat.id), { scroll: false }); }} className={`relative flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors ${isSelected ? 'bg-primary/[0.08]' : 'hover:bg-slate-50'} ${isUnread ? 'bg-primary/[0.03]' : ''}`}>
                      {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-primary" />}
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        {chat.otherUser?.avatar_url ? <img src={chat.otherUser.avatar_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-400"><User size={20} /></div>}
                        {isUnread && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2"><p className={`truncate text-sm ${isUnread ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>{name}</p><span className="shrink-0 text-[10px] font-semibold text-slate-400">{time ? time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span></div>
                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-400">{listing?.title || listing?.brand || 'Machine part'}</p>
                        <div className="mt-1 flex items-center justify-between gap-2"><p className={`truncate text-xs ${isUnread ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{chat.latestMessage?.content || 'No messages yet'}</p>{isUnread && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">{chat.unreadCount}</span>}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-0 min-w-0 flex-col bg-[#f7fafb]">
              {selectedChat ? (() => {
                const name = selectedChat.otherUser?.username || selectedChat.otherUser?.full_name || 'User';
                const listing = Array.isArray(selectedChat.listings) ? selectedChat.listings[0] ?? null : selectedChat.listings ?? null;
                return <>
                  <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">{selectedChat.otherUser?.avatar_url ? <img src={selectedChat.otherUser.avatar_url} alt="" className="h-full w-full object-cover" /> : <User size={19} />}</div><div className="min-w-0"><h2 className="truncate text-sm font-black text-slate-900">{name}</h2><p className="truncate text-[11px] font-semibold text-slate-400">{listing?.title || listing?.brand || 'Conversation'}</p></div></div>
                    <button type="button" aria-label="Chat options" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><MoreVertical size={18} /></button>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    <div className="mx-auto mb-5 w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold text-slate-400 shadow-sm">Conversation started</div>
                    <div className="mx-auto flex max-w-2xl flex-col gap-2">
                      {activeMessages.map(message => {
                        const mine = message.sender_id === currentUserId;
                        const isOffer = message.type === 'offer';
                        return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isOffer ? 'border border-primary/25 bg-primary/[0.06]' : mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'}`}>
                          {isOffer ? <><p className="text-[10px] font-black uppercase tracking-wider text-primary">{mine ? 'You made an offer' : 'Received an offer'}</p><p className="mt-1 text-2xl font-black text-slate-900">PKR {Number(message.offer_amount || 0).toLocaleString()}</p>{message.content && <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{message.content}</p>}</> : <p className="whitespace-pre-wrap text-sm leading-5">{message.content}</p>}
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOffer ? 'text-slate-400' : mine ? 'text-white/65' : 'text-slate-400'}`}>{new Date(message.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}{mine && <CheckCheck size={13} />}</div>
                        </div></div>;
                      })}
                    </div>
                  </div>
                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4"><div className="mx-auto flex max-w-2xl items-center gap-2"><input value={newMessage} onChange={event => setNewMessage(event.target.value)} placeholder="Type a message" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" /><button type="submit" disabled={sending || !newMessage.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"><Send size={17} /></button></div></form>
                </>;
              })() : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary"><MessageSquare size={28} /></div><h2 className="mt-5 text-xl font-black text-slate-900">Select a conversation</h2><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">Choose a chat from the left to view messages and reply.</p></div>}
            </section>
          </div>
          <div className="hidden">
          {/* Legacy full-width list kept as a fallback for route compatibility. */}
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
                    href={`/messages?chat=${encodeURIComponent(chat.id)}`}
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
          </div>
          </>
        )}
      </div>
    </div>
  );
}