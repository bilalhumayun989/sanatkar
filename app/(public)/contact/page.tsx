'use client';

import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Send, User, Mail, Phone, MessageSquare, MapPin, Clock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function ContactPage() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 1200);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary/20 selection:text-primary">
            <Navbar />

            <main className="flex-grow pt-16">

                {/* ── Hero Section ── */}
                <section className="relative py-20 sm:py-24 flex items-center justify-center overflow-hidden bg-white border-b border-slate-200/80">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
                        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[250px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                    </div>

                    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6 shadow-sm">
                            <Sparkles size={14} /> Get In Touch
                        </span>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] mb-4 text-slate-900">
                            Let's Talk Business
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                            Have questions about industrial equipment, custom sourcing, or partnerships? Our dedicated support team responds within 24 hours.
                        </p>
                    </div>
                </section>

                {/* ── Quick Contact Badges ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 relative z-20 mb-16">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-5xl mx-auto">
                        {[
                            { icon: <Phone size={20} />, label: 'Direct Helpline', value: '0800-SANAT-KAR' },
                            { icon: <Mail size={20} />, label: 'Email Support', value: 'support@sanatkar.com' },
                            { icon: <Clock size={20} />, label: 'Working Hours', value: 'Mon–Sat, 9:00 AM – 6:00 PM' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Form & Context Grid ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-start">

                        {/* Left — Context Info */}
                        <div className="lg:col-span-5 flex flex-col justify-between space-y-8 lg:sticky lg:top-28">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight mb-4 text-slate-900">
                                    We're Here to <br />
                                    <span className="text-primary">Power Your Business</span>
                                </h2>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium max-w-md">
                                    Looking for rare industrial parts, wholesale machinery, or dynamic seller support? Fill in the details and our engineering consultants will connect with you.
                                </p>
                            </div>

                            {/* Location Details */}
                            <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Headquarters</p>
                                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                                            123 Industrial Area, Canal Bank Road,<br />
                                            Faisalabad, Pakistan
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Social Presence */}
                            <div>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Connect With Us</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].map((social) => (
                                        <a 
                                            key={social} 
                                            href="#"
                                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 shadow-sm"
                                        >
                                            {social}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right — Interactive Form */}
                        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 xl:p-10 shadow-xl relative overflow-hidden">
                            <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-primary/5 blur-[90px] rounded-full pointer-events-none" />

                            {submitted ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mb-2 animate-bounce">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">Message Delivered!</h3>
                                    <p className="text-slate-600 text-sm max-w-sm font-medium leading-relaxed">
                                        Thank you for reaching out. A representative from SanatKar team will review your message and reply via email shortly.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 border border-slate-200"
                                    >
                                        Send Another Query <ArrowRight size={14} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                                    <div className="border-b border-slate-100 pb-4 mb-2">
                                        <h3 className="text-xl font-extrabold text-slate-900">Send Us a Message</h3>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Please fill out all required fields below.</p>
                                    </div>

                                    {/* Name & Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Your Full Name"
                                                required
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email Address"
                                                required
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone & Subject */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Phone Number"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="Inquiry Subject"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                                        />
                                    </div>

                                    {/* Message Textarea */}
                                    <div className="relative">
                                        <MessageSquare size={16} className="absolute left-4 top-4 text-slate-400 pointer-events-none" />
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="Detail your query or project requirements..."
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 py-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending Message...
                                            </span>
                                        ) : (
                                            <>
                                                Submit Message
                                                <Send size={15} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                    </div>
                </section>

                {/* ── Map Card ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="rounded-3xl overflow-hidden border border-slate-200 h-64 sm:h-80 bg-white relative flex items-center justify-center group shadow-sm">
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                        <div className="relative z-10 text-center p-6 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl max-w-sm shadow-lg group-hover:border-primary/40 transition-all duration-300">
                            <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                                <MapPin size={24} />
                            </div>
                            <h4 className="text-base font-extrabold text-slate-900">Faisalabad, Pakistan</h4>
                            <p className="text-xs text-slate-500 mt-1 font-medium">123 Industrial Area, Canal Bank Road</p>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}