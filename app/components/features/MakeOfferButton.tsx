'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MakeOfferModal from './MakeOfferModal';

interface MakeOfferButtonProps {
    listingId: string;
    sellerId: string;
    currentPrice: number;
    compact?: boolean;
}

export default function MakeOfferButton({ listingId, sellerId, currentPrice, compact = false }: MakeOfferButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className={compact ? "flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-primary/90" : "w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase"}
            >
                <MessageSquare size={compact ? 17 : 20} /> {compact ? 'Make offer' : 'MAKE OFFER'}
            </button>

            <MakeOfferModal
                listingId={listingId}
                sellerId={sellerId}
                currentPrice={currentPrice}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
