'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, ChevronRight, User, Check } from 'lucide-react';
import { createClient } from '@/lib/auth/supabase/client';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  offer_amount?: number | null;
  is_read: boolean;
  created_at: string;
}

interface ChatDetails {
  id: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    image_urls: string[];
  };
  otherUser?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface ChatRoomProps {
  chatId: string;
}

const QUICK_SUGGESTIONS = [
  'Is it available?',
  'Can you do better?',
  'Share your location',
];

export default function ChatRoomMobile({ chatId }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatDetails, setChatDetails] = useState<ChatDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: chatData } = await supabase
        .from('chats')
        .select(`
          id,
          buyer_id,
          seller_id,
          listing:listings (
            id,
            title,
            price,
            image_urls
          )
        `)
        .eq('id', chatId)
        .single();

      if (chatData) {
        const otherUserId = chatData.buyer_id === user.id ? chatData.seller_id : chatData.buyer_id;
        
        let profile = null;
        if (otherUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', otherUserId)
            .single();
          profile = profileData;
        }

        setChatDetails({
          id: chatData.id,
          listing: Array.isArray(chatData.listing) ? chatData.listing[0] : chatData.listing,
          otherUser: profile || { full_name: 'Machine Seller' },
        });
      }

      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (msgData) {
        setMessages(msgData);
      }

      setLoading(false);
    }

    initChat();

    const supabase = createClient();
    const channel = supabase
      .channel(`room_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !currentUserId) return;

    const supabase = createClient();
    setNewMessage('');

    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content: textToSend,
      type: 'text',
      is_read: false,
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'USD 0';
    return price >= 1000 ? `USD ${(price / 1000).toFixed(0)}K` : `USD ${price}`;
  };

  return (
    // fixed inset-0 screen height ko lock karega, pb-[65px] bottom navbar ki jagah chorega
    <div className="fixed inset-0 lg:hidden flex flex-col bg-[#F6FBFC] pb-[65px] z-10 overflow-hidden">
      
      {/* 1. Header Bar (Fixed Top) */}
      <div className="bg-[#13BDC4] text-white py-3 px-4 shadow-sm shrink-0 flex items-center gap-3">
        <Link href="/messages" className="active:scale-95 transition-transform p-1">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-white overflow-hidden relative shrink-0">
            {chatDetails?.otherUser?.avatar_url ? (
              <Image
                src={chatDetails.otherUser.avatar_url}
                alt="Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">
              {chatDetails?.otherUser?.full_name || 'Machine Seller'}
            </h1>
            <p className="text-[10px] text-white/80 font-medium">Active now</p>
          </div>
        </div>
      </div>

      {/* 2. Messages List (Single Scrollable Container) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Listing Banner */}
        {chatDetails?.listing && (
          <Link
            href={`/listings/${chatDetails.listing.id}`}
            className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-slate-100/80 mb-4 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src={chatDetails.listing.image_urls?.[0] || '/placeholder.png'}
                  alt={chatDetails.listing.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                  {chatDetails.listing.title}
                </h3>
                <p className="text-xs font-extrabold text-[#13BDC4] mt-0.5">
                  {formatPrice(chatDetails.listing.price)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </Link>
        )}

        {/* Messages */}
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-10">Loading messages...</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-xs shadow-xs ${
                    isMe
                      ? 'bg-[#13BDC4] text-white rounded-2xl rounded-br-sm'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-sm'
                  }`}
                >
                  <p className="font-medium leading-relaxed">{msg.content}</p>

                  <div
                    className={`flex items-center gap-1 justify-end mt-1 ${
                      isMe ? 'text-white/70' : 'text-slate-400'
                    }`}
                  >
                    <span className="text-[9px]">4 days ago</span>
                    {isMe && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Controls (Fixed directly above Bottom Navigation) */}
      <div className="bg-[#F6FBFC] shrink-0 pt-2 pb-2 border-t border-slate-200/50">
        {/* Quick Suggestions */}
        {/* <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
          {QUICK_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(suggestion)}
              className="px-3 py-1.5 bg-white border border-[#13BDC4]/40 text-[#13BDC4] rounded-full text-[11px] font-medium shrink-0 active:scale-95 transition-all shadow-xs"
            >
              {suggestion}
            </button>
          ))}
        </div> */}

        {/* Input Field */}
        <form onSubmit={handleSend} className="px-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-11 px-4 bg-white rounded-full text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#13BDC4]/30 border border-slate-200/80 shadow-xs"
          />
          <button
            type="submit"
            className="w-11 h-11 bg-[#13BDC4] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
          >
            <Send className="w-4 h-4 -mr-0.5" />
          </button>
        </form>
      </div>

    </div>
  );
}