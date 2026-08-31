'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/auth/supabase/client';
import Link from 'next/link';
import { MessageSquare, Loader2, User } from 'lucide-react';
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

                // Fetch chats where user is buyer or seller
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
                    // Enrich with profiles
                    const enhancedChats = await Promise.all(data.map(async (chat) => {
                        const otherUserId = chat.buyer_id === user.id ? chat.seller_id : chat.buyer_id;
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', otherUserId)
                            .maybeSingle();

                        // Fetch latest message
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MessageSquare size={32} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-black text-secondary mb-2">No messages yet</h2>
                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">When you make offers or receive offers on your listings, your conversations will appear here.</p>
                    <Link href="/buyer" className="btn-primary px-8 py-3 rounded-xl font-bold inline-block">
                        Browse Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl font-black text-secondary mb-8 tracking-tight">Messages & Offers</h1>
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {chats.map((chat) => {
                        const listing = Array.isArray(chat.listings) ? chat.listings[0] ?? null : chat.listings ?? null;
                        const listingTitle = listing?.title || listing?.make || listing?.brand || 'Listing';
                        const isUnread = chat.latestMessage && !chat.latestMessage.is_read && chat.latestMessage.sender_id !== currentUserId;

                        return (
                            <Link 
                                key={chat.id} 
                                href={`/messages/${chat.id}`}
                                className={`block p-5 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                        {chat.otherUser?.avatar_url ? (
                                            <img src={chat.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="text-gray-400" size={22} />
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h3 className={`text-base truncate ${isUnread ? 'font-black text-secondary' : 'font-bold text-gray-800'}`}>
                                                {chat.otherUser?.username || chat.otherUser?.full_name || (chat.buyer_id === currentUserId ? 'Seller' : 'Buyer')}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                {chat.latestMessage?.created_at ? new Date(chat.latestMessage.created_at).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-primary mb-1 truncate">
                                            Re: {listingTitle}
                                        </p>
                                        <p className={`text-sm truncate ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                            {chat.latestMessage?.type === 'offer'
                                                ? `💰 Offered PKR ${Number(chat.latestMessage.offer_amount).toLocaleString()}`
                                                : chat.latestMessage?.content || 'No messages yet'}
                                        </p>
                                    </div>
                                    {isUnread && (
                                        <div className="w-3 h-3 bg-primary rounded-full shrink-0 shadow-sm" />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
