'use client';

import { Mail, MapPin, Phone, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();
    const [newsletterEmail, setNewsletterEmail] = useState('');

    const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const subject = encodeURIComponent('Subscribe me to Sanatkar updates');
        const body = encodeURIComponent(`Please add ${newsletterEmail} to the Sanatkar email updates list.`);
        window.location.href = `mailto:support@sanatkar.com?subject=${subject}&body=${body}`;
    };

    return (
        <footer className="hidden md:block relative bg-white text-slate-600 pt-16 pb-8 border-t border-slate-200 font-sans" id="contact">
            
           

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-100">
                    
                    {/* ── Brand & About ── */}
                    <div className="lg:col-span-4 space-y-5">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                {t('brand_name_1')}<span className="text-[#0092B8] ml-1">{t('brand_name_2')}</span>
                            </span>
                        </Link>

                        <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
                            {t('footer_desc')}
                        </p>

                        <a href="mailto:support@sanatkar.com" className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-[#006b80] hover:underline"><Mail size={16} /> support@sanatkar.com</a>
                    </div>


                    <div className="lg:col-span-2">
                        <h4 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0092B8]" /> Explore
                        </h4>
                        <nav aria-label="Footer links" className="flex flex-col items-start gap-3.5 text-sm font-medium">
                            <Link href="/blogs" className="hover:text-[#0092B8]">Blogs</Link>
                            <Link href="/terms-and-conditions" className="hover:text-[#0092B8]">Terms & Conditions</Link>
                            <Link href="/privacy-policy" className="hover:text-[#0092B8]">Privacy Policy</Link>
                        </nav>
                    </div>

                    {/* ── Contact Info ── */}
                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0092B8]" />
                            {t('get_in_touch')}
                        </h4>
                        <ul className="space-y-3.5 text-sm font-medium">
                            <li className="flex items-start gap-3 group">
                                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[#0092B8] shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <span className="text-slate-600 text-xs sm:text-sm leading-relaxed mt-0.5">
                                    123 Industrial Area, Canal Bank Road,<br />Faisalabad, Pakistan
                                </span>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[#0092B8] shrink-0">
                                    <Phone size={16} />
                                </div>
                                <span className="text-slate-600 text-xs sm:text-sm">
                                    0800-SANAT-KAR
                                </span>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-[#0092B8] shrink-0">
                                    <Mail size={16} />
                                </div>
                                <a href="mailto:support@sanatkar.com" className="text-slate-600 text-xs sm:text-sm hover:text-[#0092B8]">
                                    support@sanatkar.com
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* ── Newsletter ── */}
                    <div className="lg:col-span-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0092B8]" />
                            {t('newsletter')}
                        </h4>
                        <p className="text-slate-500 text-xs leading-relaxed mb-4 font-medium">
                            Receive daily stock updates and machinery deals.
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    aria-label="Email address for Sanatkar updates"
                                    value={newsletterEmail}
                                    onChange={event => setNewsletterEmail(event.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0092B8] focus:ring-1 focus:ring-[#0092B8] transition-all pr-12 font-medium"
                                />
                                <button 
                                    type="submit"
                                    aria-label="Subscribe to email updates"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#006b80] hover:bg-[#005466] text-white px-3 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-md shadow-[#006b80]/20"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 text-slate-500">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 px-4 py-5 text-center sm:px-6 md:grid-cols-3 md:text-left lg:px-8">
                    <p className="text-[11px] font-medium sm:text-xs">© 2026 SanatKar Marketplace. All rights reserved.</p>

                    <a
                        href="https://broshtech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="justify-self-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:text-[#006b80] sm:text-xs"
                    >
                        Designed <span className="px-1 text-slate-300">||</span> Developed by{' '}
                        <span className="font-bold text-[#006b80]">BroshTech</span>
                    </a>

                    <nav aria-label="Social media" className="flex items-center justify-center gap-5 text-xs font-medium md:justify-self-end">
                        <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#006b80]">Instagram</a>
                        <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#006b80]">Facebook</a>
                        <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#006b80]">TikTok</a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
