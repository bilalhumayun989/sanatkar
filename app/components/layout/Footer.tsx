'use client';

import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, ShieldCheck, ArrowUpRight, Send, Package, Store } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Footer() {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();

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

                        {/* Social Links */}
                        <div className="flex items-center gap-2 pt-2">
                            {[
                                { icon: Facebook, href: '#' },
                                { icon: Twitter, href: '#' },
                                { icon: Instagram, href: '#' },
                                { icon: Youtube, href: '#' }
                            ].map((social, i) => (
                                <a 
                                    key={i} 
                                    href={social.href} 
                                    className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-white hover:bg-[#0092B8] hover:border-[#0092B8] transition-all duration-200"
                                >
                                    <social.icon size={16} />
                                </a>
                            ))}
                        </div>
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
                                <span className="text-slate-600 text-xs sm:text-sm">
                                    support@sanatkar.com
                                </span>
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
                        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0092B8] focus:ring-1 focus:ring-[#0092B8] transition-all pr-12 font-medium"
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#0092B8] hover:bg-[#007b9b] text-white px-3 rounded-lg flex items-center justify-center transition-all active:scale-95 shadow-md shadow-[#0092B8]/20"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* ── Bottom Bar ── */}
                <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
                    <p>© 2026 SanatKar Marketplace. All rights reserved.</p>
                    
                    <a
                        href="https://broshtech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all duration-200"
                    >
                        <span>Designed & Developed by</span>
                        <span className="font-bold text-[#0092B8]">BroshTech</span>
                    </a>
                </div>

            </div>
        </footer>
    );
}