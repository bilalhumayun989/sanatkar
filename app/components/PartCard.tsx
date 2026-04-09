'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Part } from '../data/mockData';
import { Settings, RotateCcw, Package, MapPin, Heart, ArrowRight } from 'lucide-react';
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
            className="card-premium group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative h-56 w-full overflow-hidden">
                <Image
                    src={part.image}
                    alt={`${part.brand} ${part.partName}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Overlay with Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/20 backdrop-blur-sm">
                        {t('new_arrival')}
                    </span>
                    {part.featured && (
                        <span className="bg-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm">
                            {t('featured_badge')}
                        </span>
                    )}
                </div>

                <button
                    onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
                    className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isLiked
                        ? 'bg-primary text-white'
                        : 'bg-white/20 text-white backdrop-blur-md hover:bg-white hover:text-primary shadow-lg'
                        }`}
                >
                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-secondary font-black text-lg leading-tight group-hover:text-primary transition-colors tracking-tight">
                        {part.brand} <span className="font-medium text-gray-500">{part.partName}</span>
                    </h3>
                    <span className="text-primary font-bold text-[10px] bg-primary/5 px-2 py-0.5 rounded-lg uppercase tracking-wider">{part.category}</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400 mb-5">
                    <MapPin size={12} className="text-primary/60" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{part.location}</span>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-1 mb-6 bg-muted/50 rounded-2xl p-3 border border-gray-100/50">
                    <div className="flex flex-col items-center gap-1">
                        <Settings size={14} className="text-gray-400" />
                        <span className="text-[9px] font-bold text-secondary text-center leading-[1.1]">{part.compatibility}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 border-x border-gray-200/50">
                        <RotateCcw size={14} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-secondary">{part.condition}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Package size={14} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-secondary">{part.stockStatus}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">{t('part_price')}</p>
                        <p className="text-secondary font-black text-xl tracking-tighter">{language === 'ur' ? 'روپے' : 'PKR'} {part.price.toLocaleString()}</p>
                    </div>
                    <Link
                        href={`/buyer/${part.id}`}
                        className="w-11 h-11 bg-secondary text-white rounded-xl flex items-center justify-center hover:bg-primary transition-all shadow-lg active:scale-95 group/btn"
                    >
                        <ArrowRight size={20} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
