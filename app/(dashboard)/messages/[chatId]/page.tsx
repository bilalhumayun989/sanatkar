'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/auth/supabase/client';
import { useRouter } from 'next/navigation';
import { use as reactUse } from 'react';
import { ArrowLeft, Send, Loader2, Info, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ChatRoomMobile from '@/app/components/mobile/ChatRoomMobile';

interface Message {
    id: string;
    sender_id: string;
    content: string;
    type: string;
    offer_amount: number | null;
    created_at: string;
}

interface UserProfile {
    username?: string;
    full_name?: string;
    avatar_url?: string;
}

interface ChatData {
    id: string;
    buyer_id: string;
    seller_id: string;
    listings?: {
        id: string;
        title?: string;
        brand?: string;
        price?: number | string;
        image_urls?: string[];
    } | null;
}

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = reactUse(params);
    const router = useRouter();
    const [isMobileView, setIsMobileView] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
    const [chatDetails, setChatDetails] = useState<ChatData | null>(null);
    const [otherUserProfile, setOtherUserProfile] = useState<UserProfile | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        const updateView = () => setIsMobileView(window.innerWidth < 1024);
        updateView();
        window.addEventListener('resize', updateView);
        return () => window.removeEventListener('resize', updateView);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const supabase = createClient();
        supabaseRef.current = supabase;

        const channelName = `chat-room-${chatId}-${Date.now()}`;
        let userIdForRealtime: string | null = null;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${chatId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    if (userIdForRealtime && newMsg.sender_id !== userIdForRealtime) {
                        supabase
                            .from('messages')
                            .update({ is_read: true })
                            .eq('id', newMsg.id)
                            .then();
                    }
                }
            )
            .subscribe();

        const loadChat = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login?next=/messages');
                    return;
                }
                userIdForRealtime = user.id;
                setCurrentUser(user);

                const { data: chatData, error: chatError } = await supabase
                    .from('chats')
                    .select('*, listings:listing_id (id, title, brand, price, image_urls)')
                    .eq('id', chatId)
                    .single();

                if (chatError || !chatData) {
                    router.push('/messages');
                    return;
                }

                if (chatData.buyer_id !== user.id && chatData.seller_id !== user.id) {
                    router.push('/messages');
                    return;
                }

                setChatDetails(chatData);

                const otherUserId = chatData.buyer_id === user.id ? chatData.seller_id : chatData.buyer_id;
                if (otherUserId) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .maybeSingle();
                    setOtherUserProfile(profile);
                }

                const { data: msgData, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', chatId)
                    .order('created_at', { ascending: true });

                if (!msgError && msgData) {
                    setMessages(msgData);

                    const unreadIds = msgData
                        .filter(m => m.sender_id !== user.id && !m.is_read)
                        .map(m => m.id);

                    if (unreadIds.length > 0) {
                        await supabase
                            .from('messages')
                            .update({ is_read: true })
                            .in('id', unreadIds);
                    }
                }

            } catch (error) {
                console.error('Chat load error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadChat();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [chatId, router]);

    if (isMobileView) {
        return <ChatRoomMobile chatId={chatId} />;
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        if (!currentUser?.id) {
            router.push('/login?next=/messages');
            return;
        }

        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        try {
            const supabase = supabaseRef.current;
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: currentUser.id,
                    content: content,
                    type: 'text'
                })
                .select()
                .single();

            if (error) throw error;
            setMessages(prev => prev.find(m => m.id === data.id) ? prev : [...prev, data]);
        } catch (err) {
            console.error('Send error', err);
            setNewMessage(content);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!chatDetails) return null;

    const listing = chatDetails.listings;
    const isSeller = currentUser?.id === chatDetails.seller_id;
    const otherUserName = otherUserProfile?.username || otherUserProfile?.full_name || (isSeller ? 'Buyer' : 'Seller');
    const otherUserAvatar = otherUserProfile?.avatar_url;

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-24">
            <div className="w-full bg-white rounded-[2rem] shadow-md border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50 shrink-0">
                    <Link href="/messages" className="p-2 hover:bg-white rounded-full transition-colors text-gray-500">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        {/* Other user info */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                {otherUserAvatar ? (
                                    <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={20} className="text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-black text-secondary text-base leading-tight truncate">{otherUserName}</h2>
                                <p className="text-xs font-bold text-gray-400 truncate">
                                    {listing?.title || listing?.brand || 'Listing'}
                                </p>
                            </div>
                        </div>

                        {/* Listing snippet */}
                        {listing && (
                            <Link
                                href={`/buyer/${listing.id}`}
                                className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 hover:border-primary transition-colors shrink-0"
                            >
                                <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                    {listing.image_urls?.[0] && (
                                        <Image src={listing.image_urls[0]} alt="Part" fill sizes="40px" className="object-cover" />
                                    )}
                                </div>
                                <div className="hidden sm:block text-right pr-2">
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Listed Price</p>
                                    <p className="text-sm font-black text-primary">PKR {Number(listing.price).toLocaleString()}</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/30">
                    <div className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest my-2">
                        Conversation Started
                    </div>

                    {messages.map((msg) => {
                        const isMine = msg.sender_id === currentUser?.id;
                        const isOffer = msg.type === 'offer';

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                {!isMine && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                            {otherUserAvatar ? (
                                                <img src={otherUserAvatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={12} className="text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{otherUserName}</span>
                                    </div>
                                )}

                                {isOffer ? (
                                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-sm border ${
                                        isMine
                                            ? 'bg-primary/5 border-primary/20 text-right'
                                            : 'bg-white border-gray-200 text-left'
                                    }`}>
                                        <div className={`flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <Info size={14} />
                                            {isMine ? 'You made an offer' : 'Received an offer'}
                                        </div>
                                        <p className="text-2xl sm:text-3xl font-black text-secondary mb-2">
                                            PKR {Number(msg.offer_amount).toLocaleString()}
                                        </p>
                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                            {msg.content}
                                        </p>
                                    </div>
                                ) : (
                                    <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm break-words ${
                                        isMine
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                )}

                                <span className="text-[10px] text-gray-400 font-bold mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 transition-colors focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-sm">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                placeholder="Type your message..."
                                className="w-full max-h-24 bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-1 text-sm text-gray-800 placeholder:text-gray-400 font-medium"
                                rows={1}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-primary text-white p-3 sm:p-3.5 rounded-2xl shrink-0 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:hover:bg-primary flex items-center justify-center"
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}