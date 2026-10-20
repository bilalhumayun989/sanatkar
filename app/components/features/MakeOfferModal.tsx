'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
            setStep('Sending offer...');
            const response = await fetch('/api/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listing_id: listingId, amount, message }),
            });
            const result = await response.json();
            if (response.status === 401) {
                onClose();
                router.push(`/login?next=${encodeURIComponent(`/buyer/${listingId}`)}`);
                return;
            }
            if (!response.ok || !result.success || !result.chat_id) {
                throw new Error(result.message || 'Could not send offer.');
            }

            // Success — navigate to the chat
            setStep('');
            onClose();
            router.push(`/messages?chat=${encodeURIComponent(result.chat_id)}`);

        } catch (err: unknown) {
            console.error('Make offer error:', err);
            setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
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
