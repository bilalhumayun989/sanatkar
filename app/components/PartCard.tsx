'use client';

import Link from 'next/link';
import { Part } from '../data/mockData';
import { Heart, Star, MapPin, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface PartCardProps {
    part: Part;
}

export default function PartCard({ part }: PartCardProps) {
    const { language } = useLanguage();
    const [isLiked, setIsLiked] = useState(false);

    return (
        <div className="relative h-[420px] sm:h-[460px] lg:h-[550px] w-full rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] overflow-hidden group flex flex-col bg-[#15171a] border border-white/10">

            {/* ── Top half: image only ── */}
            <div className="relative h-[50%] w-full overflow-hidden shrink-0">
                <img
                    src={part.image}
                    alt={`${part.brand} ${part.partName}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Heart / bookmark */}
                <button
                    onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                    className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white transition-all hover:bg-white hover:text-black z-10"
                >
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>

                {/* Price badge sits on the image so it isn't lost once the section is solid black */}
                <span className="absolute top-4 left-4 sm:top-5 sm:left-5 text-white font-bold text-xs sm:text-sm bg-black/50 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl whitespace-nowrap">
                    {language === 'ur' ? 'روپے' : 'PKR'} {part.price.toLocaleString()}
                </span>
            </div>

            {/* ── Bottom half: solid black detail panel ── */}
            <div className="relative flex-1 w-full bg-[#0c0d0f] p-4 sm:p-5 lg:p-6 flex flex-col">

                {/* Title */}
                <div className="text-white font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight mb-2">
                    {part.brand}
                </div>

                {/* Description */}
                <p className="text-white/60 text-xs sm:text-[13px] mb-4 sm:mb-5 line-clamp-2 leading-relaxed flex items-start gap-1.5">
                    <MapPin size={13} className="text-white/40 mt-0.5 shrink-0" />
                    Genuine {part.brand} industrial parts, verified condition and ready for dispatch in {part.location}.
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white">
                        <Star size={12} className="text-primary" />
                        4.9
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white">
                        {part.category || 'General'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold text-white capitalize">
                        {part.condition}
                    </span>
                </div>

                {/* Button */}
                <Link
                    href={`/buyer/${part.id}`}
                    className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-primary text-white py-3 sm:py-4 text-sm sm:text-[15px] font-bold transition-colors hover:bg-primary-dark"
                >
                    View Details
                    <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}