'use client';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowRight, Instagram, Twitter, Facebook } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
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
                            Get In Touch
                        </span>
                        <h1 className="text-5xl md:text-7xl font-black !text-white tracking-tighter mb-6 leading-tight">
                            Let's Start a <br />
                            <span className="text-primary italic">Conversation</span>
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                            Have questions about our industrial parts inventory or want to list your machine parts? Our specialist team is here to assist you 24/7.
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
                                    <h2 className="text-4xl font-black !text-white tracking-tight">Contact Information</h2>
                                    <p className="text-gray-400 font-medium italic">Reach out through any of these channels.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                                    {/* Contact Card: Email */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <Mail size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">Email Us</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">General Inquiries</p>
                                        <a href="mailto:hello@SANATkar.com" className="text-gray-300 font-black hover:text-primary transition-colors">hello@SANATkar.com</a>
                                    </div>

                                    {/* Contact Card: Phone */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <Phone size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">Call Support</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">Mon-Fri from 9am to 6pm</p>
                                        <a href="tel:+923001234567" className="text-gray-300 font-black hover:text-primary transition-colors">+92 300 123 4567</a>
                                    </div>

                                    {/* Contact Card: Location */}
                                    <div className="group p-8 bg-white/[0.02] backdrop-blur-xl rounded-[2.5rem] border border-white/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                                        <div className="w-14 h-14 bg-[#0a0f1c] border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-black/50 group-hover:bg-primary group-hover:scale-110 group-hover:border-primary transition-all duration-500">
                                            <MapPin size={24} className="text-primary group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-black !text-white mb-2 uppercase tracking-tight">Industrial Hub</h3>
                                        <p className="text-gray-500 text-sm font-bold mb-1">Visit our showroom</p>
                                        <p className="text-gray-300 font-black leading-snug">Industrial Estate Phase 2,<br />Faisalabad, Pakistan</p>
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="pt-6 border-t border-white/5">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">Follow our journey</p>
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
                                            <h3 className="text-3xl font-black !text-white tracking-tight">Message Received!</h3>
                                            <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                                                Thank you for reaching out. One of our specialist advisors will contact you shortly.
                                            </p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="mt-8 px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:border-primary transition-all shadow-xl hover:shadow-primary/20"
                                            >
                                                Send Another Message
                                            </button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3 group">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Your Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. Sajid Khan"
                                                        className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none placeholder:text-gray-600"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-3 group">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Email Address</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        placeholder="sajid@SANATkar.com"
                                                        className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none placeholder:text-gray-600"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 group">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Subject</label>
                                                <select
                                                    className="w-full px-8 py-5 rounded-2xl bg-[#0a0f1c] border border-white/10 focus:border-primary focus:bg-[#0a0f1c] focus:ring-4 focus:ring-primary/10 text-sm font-bold text-white transition-all outline-none appearance-none"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                >
                                                    <option value="">Select a topic</option>
                                                    <option>Buying Machine Parts</option>
                                                    <option>Selling Surplus Stock</option>
                                                    <option>Industrial Partnerships</option>
                                                    <option>Technical Support</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>

                                            <div className="space-y-3 group">
                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Message</label>
                                                <textarea
                                                    required
                                                    rows={6}
                                                    placeholder="How can we help you today?"
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
                                                        <span>Processing Your Request...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Send Message Now</span>
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
                                        <p className="text-sm font-black text-white tracking-tight">Our support team is online</p>
                                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                            Average response: 12 minutes
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
