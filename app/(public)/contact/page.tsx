'use client';

import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { Send, User, Mail, Phone, MessageSquare, MapPin, Clock, ArrowRight } from 'lucide-react';
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
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#000] text-white">
            <Navbar />

            <main className="flex-grow">

                {/* ── Hero ── */}
                <section className="relative h-[50vh] min-h-[320px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80"
                            alt="Contact Background"
                            className="w-full h-full object-cover brightness-[0.25]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#000]/60 via-transparent to-[#000]" />
                    </div>

                    <div className="relative z-10 text-center px-4 pt-16 max-w-3xl mx-auto">
                        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 backdrop-blur-xl px-4 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-6">
                            Get In Touch
                        </span>
                        <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-4">
                            Let's Talk
                        </div>
                        <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
                            Questions about parts, pricing, or partnerships? Our team responds within 24 hours.
                        </p>
                    </div>
                </section>

                {/* ── Contact Info Cards ── */}
                <section className="container-wide py-10 px-4 sm:px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {[
                            { icon: <Phone size={20} />, label: 'Call Us', value: '0800-SANAT-KAR' },
                            { icon: <Mail size={20} />, label: 'Email Us', value: 'support@sanatkar.com' },
                            { icon: <Clock size={20} />, label: 'Working Hours', value: 'Mon–Sat, 9am–6pm' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 hover:bg-white/[0.08] transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                                    <p className="text-sm font-semibold text-white mt-0.5">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Main Content: Info + Form ── */}
                <section className="container-wide py-10 pb-20 px-4 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 max-w-6xl mx-auto">

                        {/* Left — Info */}
                        <div className="flex flex-col justify-center space-y-8">
                            <div>
                                <div className="text-3xl text-white sm:text-4xl xl:text-5xl font-black tracking-tighter leading-tight mb-4">
                                    We're Here to <br />
                                    <span className="text-primary">Help You</span>
                                </div>
                                <p className="text-gray-400 leading-relaxed text-sm sm:text-base max-w-md">
                                    Looking for industrial machinery, spare parts, or have any questions?
                                    Fill out the form and our team will get back to you shortly.
                                </p>
                            </div>

                            {/* Address */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shrink-0">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Our Location</p>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        123 Industrial Area, Canal Bank Road,<br />
                                        Faisalabad, Pakistan
                                    </p>
                                </div>
                            </div>

                            {/* Social / CTA */}
                            <div className="pt-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Follow Us</p>
                                <div className="flex flex-wrap gap-3">
                                    {['Facebook', 'Instagram', 'LinkedIn', 'YouTube'].map((s) => (
                                        <a key={s} href="#"
                                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 hover:border-primary/30 transition-all">
                                            {s}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right — Form */}
                        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 xl:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
                            {submitted ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                                        <Send size={28} className="text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-black">Message Sent!</h3>
                                    <p className="text-gray-400 text-sm max-w-xs">
                                        We've received your message and will get back to you within 24 hours.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="mt-4 flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                                    >
                                        Send another <ArrowRight size={14} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <h3 className="text-xl font-black mb-6">Send a Message</h3>

                                    {/* Name + Email */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="Your Name"
                                                required
                                                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="Email Address"
                                                required
                                                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone + Subject */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="Phone Number"
                                                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            placeholder="Subject"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition"
                                        />
                                    </div>

                                    {/* Message */}
                                    <div className="relative">
                                        <MessageSquare size={16} className="absolute left-4 top-4 text-gray-500 pointer-events-none" />
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="Write your message..."
                                            required
                                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </span>
                                        ) : (
                                            <>
                                                Send Message
                                                <Send size={16} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                    </div>
                </section>

                {/* ── Map placeholder ── */}
                <section className="container-wide px-4 sm:px-6 pb-20">
                    <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-white/10 h-[220px] sm:h-[280px] bg-white/5 flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <MapPin size={32} className="text-primary mx-auto" />
                            <p className="text-sm font-bold text-gray-400">Faisalabad, Pakistan</p>
                            <p className="text-xs text-gray-600">123 Industrial Area, Canal Bank Road</p>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
