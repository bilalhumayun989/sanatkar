'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Part } from '../data/mockData';
import { Settings, Package, MapPin, Heart, Star } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

interface PartCardProps {
    part: Part;
}

export default function PartCard({ part }: PartCardProps) {
    const { t, language } = useLanguage();
    const [isHovered, setIsHovered] = useState(false);
    const [isLiked, setIsLiked] = useState(false);

    return (
        <div
className="relative h-[420px] sm:h-[460px] lg:h-[550px] w-full rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] overflow-hidden group block"            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background Image */}
            <Image
                src={part.image}
                alt={`${part.brand} ${part.partName}`}
                fill
                className="object-cover object-bottom transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Same Color Overlay for all cards - Dark Slate/Black */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#15171a] via-[#15171a]/70 to-transparent/10"></div>

            {/* Top Right Heart/Bookmark Icon */}
            <button
                onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white transition-all hover:bg-white hover:text-black z-10"            >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
            </button>

            {/* Bottom Content Area */}
            {/* Bottom Content Area */}
            <div className="absolute bottom-0 left-0 w-full z-10 p-0">
                <div
                  className="
relative
border border-white/20
bg-white/8
backdrop-blur-sm
p-4 sm:p-5 lg:p-6

before:absolute
before:top-0
before:left-1/2
before:-translate-x-1/2
before:-translate-y-1/2
before:h-16 sm:before:h-20
before:w-full
before:rounded-full
before:bg-white/30
before:blur-3xl
before:content-['']
"
                >
                    {/* Title and Price Row */}
                    <div className="flex justify-between items-start mb-2 gap-3">
                        <div className="text-white font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight">
                            {part.brand}{" "}
                            <span className="font-medium text-white/90">
                                {part.partName}
                            </span>
                        </div>

                        <span className="text-white font-bold text-xs sm:text-sm bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl whitespace-nowrap">
                            {language === "ur" ? "روپے" : "PKR"}{" "}
                            {part.price.toLocaleString()}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-white/75 text-xs sm:text-[13px] mb-4 sm:mb-5 line-clamp-2 leading-relaxed">
                        Genuine {part.brand} industrial parts for your machinery.
                        Verified condition and ready for dispatch in {part.location}.
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                            <Star size={12} />
                            4.9
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                            {part.category || "General"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                            {part.condition}
                        </span>
                    </div>

                    {/* Button */}
                    <Link
                        href={`/buyer/${part.id}`}
className="flex w-full items-center justify-center rounded-full bg-primary text-white py-3 sm:py-4 text-sm sm:text-[15px] font-bold transition hover:scale-[1.02]"                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}
