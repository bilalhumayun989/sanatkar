'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowRight, Instagram, Twitter, Facebook } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ContactPage() {
    const {t} = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0f1c] text-white selection:bg-primary/30">
            <Navbar forceSolid />

            <main className="flex-grow">
                {/* Hero Section with Background */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
                            alt="Contact Background"
                            className="w-full h-full object-cover grayscale-[0.2] brightness-[0.2]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c]/80 via-transparent to-[#0a0f1c]" />
                    </div>

                    <div className="container-wide relative z-10 text-center px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6 backdrop-blur-md border border-primary/20">
                            {t("contact_title")}
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black !text-white tracking-tighter mb-6 leading-tight">
                            {t("contact_main_heading")} <br />
                            <span className="text-primary italic">{t("contact_main_heading_span")}</span>
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                            {t("contact_desc")}
                        </p>
                    </div>
                </section>

                {/* Contact Content */}
                <section className="py-24 px-4 -mt-20 relative z-20">
                    <div className="container-wide max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                            {/* Left Side: Contact Info */}
                            <div className="lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black !text-white tracking-tight">{t('contact_info_title')}</h2>
                                    <p className="text-gray-400 font-medium italic">{t('contact_info_desc')}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                    {/* Contact Card: Email */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <Mail size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">{t('email_us')}</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">{t('general_inquiries')}</p>
                                        <a href="mailto:hello@SANATkar.com" className="text-gray-300 font-black hover:text-primary transition-colors">hello@SANATkar.com</a>
                                    </div>

                                    {/* Contact Card: Phone */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <Phone size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">{t('call_support')}</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">{t('support_hours')}</p>
                                        <a href="tel:+923001234567" className="text-gray-300 font-black hover:text-primary transition-colors">+92 300 123 4567</a>
                                    </div>

                                    {/* Contact Card: Location */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <MapPin size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">{t('industrial_hub')}</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">{t('visit_showroom')}</p>
                                        <p className="text-gray-300 font-black leading-snug">{t('address')}</p>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">{t('follow_journey')}</p>
                                    <div className="flex gap-4">
                                        {[Instagram, Twitter, Facebook].map((Icon, idx) => (
                                            <a key={idx} href="#" className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-xl flex items-center justify-center hover:bg-primary hover:border-primary hover:-translate-y-1 transition-all shadow-lg hover:shadow-primary/20">
                                                <Icon size={20} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Contact Form */}
                            <div className="lg:col-span-7 animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                                <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] shadow-2xl border border-white/5 p-10 md:p-14 relative overflow-hidden">
                                    {/* Subtle decorative elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                                    {submitted ? (
                                        <div className="text-center py-20 space-y-6 animate-in zoom-in-95 duration-500">
                                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                                <Send size={40} className="animate-bounce" />
                                            </div>
                                            <h3 className="text-3xl font-black !text-white tracking-tight">{t('message_received')}</h3>
                                            <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                                                {t('thank_you_msg')}
                                            </p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="mt-8 px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:border-primary transition-all shadow-xl hover:shadow-primary/20"
                                            >
                                                {t('send_another')}
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3 group">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">{t('your_name')}</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder={t('name_placeholder')}
                                                        className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none placeholder:text-gray-600"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3 group">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">{t('email_address')}</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder={t('email_placeholder')}
                                                        className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none placeholder:text-gray-600"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 group">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">{t('subject')}</label>
                                                <select
                                                    className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none appearance-none"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                >
                                                    <option value="">{t('select_topic')}</option>
                                                    <option>{t('buy_machine_parts')}</option>
                                                    <option>{t('sell_surplus')}</option>
                                                    <option>{t('ind_partnerships')}</option>
                                                    <option>{t('tech_support')}</option>
                                                    <option>{t('other_topic')}</option>
                                                </select>
                                            </div>

                                            <div className="space-y-3 group">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">{t('message_label')}</label>
                                                <textarea
                                                    required
                                                    rows={6}
                                                    placeholder={t('message_placeholder')}
                                                    className="w-full px-8 py-6 rounded-[2rem] bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-medium text-white resize-none transition-all outline-none placeholder:text-gray-600"
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                />
                                            </div>

                                            <button
                                                disabled={isSubmitting}
                                                type="submit"
                                                className="w-full py-6 bg-primary text-white rounded-[1.5rem] text-sm font-black shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 group disabled:opacity-70"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                        <span>{t('processing')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{t('send_message')}</span>
                                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>

                                {/* Bottom Accent */}
                                <div className="mt-12 flex items-center justify-center gap-6">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0a0f1c] overflow-hidden shadow-xl">
                                                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Support Team" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">{t('support_team_online')}</p>
                                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            {t('avg_response')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
