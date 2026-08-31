'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MakeOfferModal from './MakeOfferModal';

interface MakeOfferButtonProps {
    listingId: string;
    sellerId: string;
    currentPrice: number;
}

export default function MakeOfferButton({ listingId, sellerId, currentPrice }: MakeOfferButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase"
            >
                <MessageSquare size={20} /> MAKE OFFER
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
