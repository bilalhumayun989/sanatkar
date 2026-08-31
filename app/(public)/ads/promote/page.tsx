'use client';

import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import AdConfigForm from '@/app/components/forms/AdConfigForm';
import { Megaphone, ShieldCheck, Zap, TrendingUp, Sparkles } from 'lucide-react';

export default function PromotePage() {
    const { t } = useLanguage();
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, authLoading, router]);

    if (authLoading || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20">
                <div className="container-wide max-w-5xl">
                    {/* Header Section */}
                    <div className="mb-12 text-center space-y-4">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                            <Sparkles size={16} className="text-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Business Growth Portal</span>
                        </div>
                        <h1 className="text-5xl font-black text-secondary tracking-tighter leading-none">
                            Promote Your <span className="text-primary italic">Brand</span>
                        </h1>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto">
                            Reach thousands of active buyers every day with premium in-feed placements.
                            Customize your promotional message below to start growing your presence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Form */}
                        <div className="lg:col-span-2 space-y-8">
                            <AdConfigForm />

                            {/* Additional Info for User */}
                            <div className="bg-secondary text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-secondary/20">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                    <Zap className="text-primary" /> Why Promote on SANATKAR?
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="text-primary shrink-0" size={18} />
                                        <span>Verified Premium Audience</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="text-primary shrink-0" size={18} />
                                        <span>3x Higher Engagement</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Megaphone className="text-primary shrink-0" size={18} />
                                        <span>Full Creative Control</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="text-primary shrink-0" size={18} />
                                        <span>Native In-Feed Integration</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Tips / Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                                <h4 className="font-black text-secondary text-sm uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">
                                    Pro Tips
                                </h4>
                                <ul className="space-y-6">
                                    <li className="space-y-2">
                                        <p className="text-xs font-black text-primary uppercase tracking-wider">Visual Impact</p>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            Use high-resolution portrait images (preferred ratio 4:5) to grab attention as users scroll.
                                        </p>
                                    </li>
                                    <li className="space-y-2">
                                        <p className="text-xs font-black text-primary uppercase tracking-wider">Direct Action</p>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            Keep your headline punchy and your "Call to Action" clear. "Learn More" or "Book Now" work best.
                                        </p>
                                    </li>
                                    <li className="space-y-2">
                                        <p className="text-xs font-black text-primary uppercase tracking-wider">Placement</p>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                            Your ad will appear naturally between listing cards on the search results page.
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-primary/5 rounded-3xl border border-primary/10 p-8 text-center">
                                <p className="text-xs font-bold text-gray-500 mb-2">Need Assistance?</p>
                                <p className="text-lg font-black text-secondary mb-4 underline decoration-primary decoration-2 underline-offset-4">0800-SANAT-KAR</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                                    Our marketing experts are <br /> available 24/7
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
