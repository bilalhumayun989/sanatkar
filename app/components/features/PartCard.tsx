'use client';

import Link from 'next/link';
import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Part } from '../../../lib/database/mockData';
import { Heart, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

interface PartCardProps {
    part: Part & { favoriteId?: string };
    onUnsave?: () => void;
    compact?: boolean;
}

export default function PartCard({ part, onUnsave, compact = false }: PartCardProps) {
    const { language } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isLiked, setIsLiked] = useState(false);
    const [favoriteId, setFavoriteId] = useState<string | null>(part.favoriteId || null);
    const [loadingFavorite, setLoadingFavorite] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setIsLiked(false);
            setFavoriteId(null);
            return;
        }

        if (favoriteId) {
            setIsLiked(true);
            return;
        }

        const loadFavorite = async () => {
            try {
                const response = await fetch('/api/favorites', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok || !result.success) throw new Error(result.message || 'Favorites lookup failed.');
                const favorite = (result.favorites || []).find((item: { listing_id: string }) => item.listing_id === part.id);
                if (favorite) {
                    setIsLiked(true);
                    setFavoriteId(favorite.id);
                } else {
                    setIsLiked(false);
                }
            } catch (err) {
                console.error('Failed to load favorite state:', err);
                setIsLiked(false);
            }
        };

        loadFavorite();
    }, [authLoading, user, part.id, favoriteId]);

    const showError = (message: string) => {
        setError(message);
        window.setTimeout(() => setError(''), 2500);
    };

    const handleFavoriteToggle = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (authLoading) return;
        if (!user) {
            router.push(`/login?next=${encodeURIComponent(`/buyer/${part.id}`)}`);
            return;
        }

        if (loadingFavorite) return;
        setLoadingFavorite(true);
        const nextValue = !isLiked;
        setIsLiked(nextValue);

        try {
            const response = await fetch('/api/favorites', {
                method: nextValue ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ listing_id: part.id }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Unable to update saved listing.');
            setFavoriteId(nextValue ? result.favorite?.id || null : null);
            if (!nextValue) onUnsave?.();
        } catch (err) {
            console.error('Favorite toggle failed', err);
            setIsLiked(!nextValue);
            showError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setLoadingFavorite(false);
        }
    };

    return (
        <div className={`relative ${compact ? 'h-[340px] rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md' : 'h-[420px] sm:h-[460px] lg:h-[550px] rounded-[24px] sm:rounded-[28px] lg:rounded-[22px] bg-[#15171a] border border-white/10'} w-full overflow-hidden group flex flex-col transition-shadow`}>
            <Link
                href={`/buyer/${part.id}`}
                className="absolute inset-0 z-0 rounded-[24px]"
                aria-label={`View details for ${part.brand} ${part.partName}`}
            />

            {/* ── Top half: image only ── */}
            <div className={`relative ${compact ? 'h-[48%]' : 'h-[50%]'} w-full overflow-hidden shrink-0 bg-slate-100`}>
                <img
                    src={part.image}
                    alt={`${part.brand} ${part.partName}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Heart / bookmark */}
                <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    className={`absolute ${compact ? 'right-3 top-3 p-2' : 'top-4 right-4 p-2 sm:top-5 sm:right-5 sm:p-2.5'} rounded-full backdrop-blur-md transition-all z-10 ${isLiked ? 'bg-primary text-white hover:bg-primary-dark' : compact ? 'bg-white/95 text-slate-700 shadow-sm hover:bg-white' : 'bg-white/20 text-white hover:bg-white'}`}
                >
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>

                {/* Price badge sits on the image so it isn't lost once the section is solid black */}
                <span className={`absolute ${compact ? 'left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs text-slate-900 shadow-sm' : 'top-4 left-4 rounded-xl bg-black/50 px-2.5 py-1.5 text-xs text-white sm:top-5 sm:left-5 sm:px-3 sm:text-sm'} font-bold backdrop-blur-md whitespace-nowrap`}>
                    {language === 'ur' ? 'روپے' : 'PKR'} {part.price.toLocaleString()}
                </span>
            </div>

            {/* ── Bottom half: solid black detail panel ── */}
            <div className={`relative flex-1 w-full ${compact ? 'bg-white p-3' : 'bg-[#000000] p-4 sm:p-5 lg:p-6'} flex flex-col`}>

                {/* Title */}
                {compact ? (
                    <>
                        <span className="mb-1 truncate text-[10px] font-bold uppercase tracking-wider text-[#079bb5]">{part.brand}</span>
                        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-slate-900">{part.partName}</h3>
                    </>
                ) : (
                    <div className="text-white font-bold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight mb-2">
                        {part.brand}
                    </div>
                )}

                {/* Description */}
                {compact ? (
                    <p className="my-1.5 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                        <MapPin size={12} className="shrink-0 text-slate-400" />
                        {part.location}
                    </p>
                ) : (
                    <p className="mb-4 sm:mb-5 flex items-start gap-1.5 text-xs leading-relaxed text-white/60 sm:text-[13px] line-clamp-2">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-white/40" />
                        {part.description
                            ? part.description
                            : part.compatibility && part.compatibility !== 'Universal'
                            ? `Compatible with ${part.compatibility}. Genuine ${part.brand} parts, verified condition and ready for dispatch in ${part.location}.`
                            : `Genuine ${part.brand} industrial parts, verified condition and ready for dispatch in ${part.location}.`
                        }
                    </p>
                )}

                {/* Tags */}
                <div className={`flex flex-wrap gap-2 ${compact ? 'mb-2' : 'mb-4 sm:mb-5'}`}>
                   
                    <span className={`rounded-full ${compact ? 'border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600' : 'border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] text-white'} font-semibold`}>
                        {part.category || 'General'}
                    </span>
                    <span className={`rounded-full ${compact ? 'border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600' : 'border border-white/10 bg-white/5 px-3.5 py-1.5 text-[11px] text-white'} font-semibold capitalize`}>
                        {part.condition}
                    </span>
                </div>

                {error && (
                    <div className="mb-3 rounded-2xl bg-red-500/10 border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">
                        {error}
                    </div>
                )}

                {/* Button */}
                <Link
                    href={`/buyer/${part.id}`}
                    className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-primary text-white ${compact ? 'py-2 text-xs' : 'py-3 text-sm sm:py-4 sm:text-[15px]'} font-bold transition-colors hover:bg-primary-dark`}
                >
                    View Details
                    <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    );
}