'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';

interface MakeOfferModalProps {
    listingId: string;
    sellerId: string;
    isOpen: boolean;
    onClose: () => void;
    currentPrice: number;
}

export default function MakeOfferModal({ listingId, sellerId, isOpen, onClose, currentPrice }: MakeOfferModalProps) {
    const router = useRouter();
    const [offerAmount, setOfferAmount] = useState<string>('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setStep('');

        const amount = parseFloat(offerAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid offer amount.');
            return;
        }
        if (!sellerId) {
            setError('Seller information is missing. Cannot send offer.');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();

            // Step 1: Verify user session
            setStep('Checking your session...');
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                onClose();
                router.push(`/login?next=${encodeURIComponent(`/buyer/${listingId}`)}`);
                return;
            }

            // Debug: log key values so we can see what's being sent
            console.log('[MakeOffer] user.id:', user.id);
            console.log('[MakeOffer] sellerId:', sellerId);
            console.log('[MakeOffer] listingId:', listingId);
            console.log('[MakeOffer] amount:', amount);

            if (user.id === sellerId) {
                setError('You cannot make an offer on your own listing.');
                setLoading(false);
                return;
            }

            // Step 2: Find or create chat
            setStep('Setting up conversation...');
            let chatId: string | null = null;

            const { data: existingChat, error: chatLookupError } = await supabase
                .from('chats')
                .select('id')
                .eq('listing_id', listingId)
                .eq('buyer_id', user.id)
                .maybeSingle();

            if (chatLookupError) {
                console.error('Chat lookup error:', chatLookupError);
                // RLS or permission error
                if (chatLookupError.code === '42501' || chatLookupError.message?.includes('permission')) {
                    setError('Permission denied. Please make sure you are logged in and try again.');
                    return;
                }
            }

            if (existingChat?.id) {
                chatId = existingChat.id;
            } else {
                // Create a new chat
                const { data: newChat, error: createChatError } = await supabase
                    .from('chats')
                    .insert({
                        listing_id: listingId,
                        buyer_id: user.id,
                        seller_id: sellerId,
                    })
                    .select('id')
                    .single();

                if (createChatError) {
                    console.error('Create chat error:', createChatError);
                    throw new Error(`Could not start conversation: ${createChatError.message}`);
                }
                chatId = newChat.id;
            }

            if (!chatId) {
                throw new Error('Failed to get or create a chat session.');
            }

            // Step 3: Save offer record
            setStep('Saving your offer...');
            const { error: offerError } = await supabase
                .from('offers')
                .insert({
                    listing_id: listingId,
                    buyer_id: user.id,
                    seller_id: sellerId,
                    offer_price: amount,
                });

            if (offerError) {
                console.error('Offer insert error:', offerError);
                // Don't block — offer table errors are non-critical
                // The message is the primary record
            }

            // Step 4: Send the offer message
            setStep('Sending message...');
            const msgContent = message.trim()
                ? message.trim()
                : `I would like to offer PKR ${amount.toLocaleString()} for this item.`;

            const { error: messageError } = await supabase
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: user.id,
                    content: msgContent,
                    type: 'offer',
                    offer_amount: amount,
                });

            if (messageError) {
                console.error('Message insert error:', messageError);
                throw new Error(`Could not send offer message: ${messageError.message}`);
            }

            // Success — navigate to the chat
            setStep('');
            onClose();
            router.push(`/messages/${chatId}`);

        } catch (err: any) {
            console.error('Make offer error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
            setStep('');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-black text-secondary">Make an Offer</h3>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-40"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Offer Amount (PKR)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rs.</span>
                            <input
                                type="number"
                                required
                                min="1"
                                placeholder={currentPrice.toString()}
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Current listed price: PKR {currentPrice.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Message (Optional)
                        </label>
                        <textarea
                            placeholder="Add a message to the seller..."
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                        />
                    </div>

                    {/* Live step indicator */}
                    {loading && step && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100">
                            <Loader2 size={15} className="animate-spin shrink-0" />
                            {step}
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !offerAmount}
                        className="w-full bg-primary text-white py-4 rounded-xl font-black tracking-widest uppercase text-sm hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <><Loader2 size={18} className="animate-spin" /> Processing...</>
                        ) : (
                            <><Send size={18} /> Send Offer</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
