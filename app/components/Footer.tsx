'use client';

import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

export default function Footer() {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    return (
        <footer className="relative bg-black text-white px-4 sm:px-6 lg:px-3 pt-14 pb-8 sm:pt-18 sm:pb-10 lg:pt-20 lg:pb-12 overflow-hidden border-t border-white/5" id="contact">
    


            <div className="container-wide relative z-10">
                <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 mb-10 sm:mb-12 lg:mb-14">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-5 sm:space-y-6 pr-0 sm:pr-4 text-left">
                        <Link href="/" className="inline-flex items-center gap-3 group w-full justify-start">
                         
                            <span className="text-2xl sm:text-3xl font-black tracking-tight">{t('brand_name_1')}<span className="ml-1  drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{t('brand_name_2')}</span></span>
                        </Link>
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm font-medium">
                            {t('footer_desc')}
                        </p>
                        <div className="flex flex-wrap items-center justify-start gap-3 pt-1">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 sm:w-11 sm:h-11  border border-primary/20 rounded-xl flex items-center justify-center hover:bg-primary hover:border-primary hover:-translate-y-1 transition-all duration-300 group">
                                    <Icon size={17} className="text-primary group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <div className="text-lg font-bold mb-4 sm:mb-6 flex items-center gap-3 text-white">
                            {t('explore')}
                        </div>
                        <ul className="space-y-4 text-gray-400 font-medium">
                            {['Used Parts', 'New Parts', 'Sell Your Parts', 'Technical Reviews', 'Industry News']
                                .filter(item => isAdmin || item !== 'Sell Your Parts')
                                .map((item, i) => (
                                    <li key={i}>
                                        <Link href="#" className="hover:text-white transition-all duration-300 inline-flex items-center gap-2 group">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white group-hover:scale-150 transition-all"></span>
                                            <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-3">
                        <div className="text-lg font-bold mb-4 sm:mb-6 flex items-center gap-3 text-white">
                            {t('get_in_touch')}
                        </div>
                        <ul className="space-y-4 font-medium">
                            <li className="flex items-start gap-4 group">
                                <div className="p-2.5  rounded-xl text-primary border border-primary/20 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <MapPin size={18} />
                                </div>
                                <span className="text-gray-400 text-sm leading-relaxed mt-1 group-hover:text-gray-300 transition-colors">123 Industrial Area, Canal Bank Road,<br />Faisalabad, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-4 group cursor-pointer">
                                <div className="p-2.5  rounded-xl text-primary border border-primary/20 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <Phone size={18} />
                                </div>
                                <span className="text-gray-400 group-hover:text-white transition-colors">0800-SANAT-KAR</span>
                            </li>
                            <li className="flex items-center gap-4 group cursor-pointer">
                                <div className="p-2.5  rounded-xl text-primary border border-primary/20 group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <span className="text-gray-400 group-hover:text-white transition-colors">support@SANATkar.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-3">
                        <div className="text-lg font-bold mb-4 sm:mb-6 flex items-center gap-3 text-white">
                            {t('newsletter')}
                        </div>
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 focus:bg-white/10 transition-all pr-14 text-white placeholder-gray-500 font-medium"
                                />
                                <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary hover:bg-primary-dark text-white px-3.5 rounded-lg active:scale-95 flex items-center justify-center transition-colors">
                                    <Mail size={16} className="group-hover/input:animate-pulse" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 relative px-1 sm:px-0">
                    <p className="text-gray-500 text-sm font-medium text-center sm:text-left">
                        © 2026 SanatKar. All rights reserved.
                    </p>
                    <a
                        href="https://broshtech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-sm font-medium text-gray-300 transition-all duration-300 hover:border-primary hover:text-white hover:shadow-lg hover:shadow-primary/20"
                    >
                        <span>Designed || Developed by</span>
                        <span className="font-semibold text-primary">BroshTech</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
