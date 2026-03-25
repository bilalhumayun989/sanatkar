import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Package } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="relative bg-secondary text-white pt-24 pb-12 overflow-hidden border-t border-white/5" id="contact">
            {/* Animated Ambient Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] translate-y-1/3 -translate-x-1/3 pointer-events-none opacity-50"></div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03] pointer-events-none"></div>

            <div className="container-wide relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8 pr-4">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-2xl group-hover:rotate-6 group-hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/25 z-10">
                                <Package size={26} className="text-white drop-shadow-md" />
                                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-3xl font-black tracking-tighter">SANAT<span className="text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">KAR</span></span>
                        </Link>
                        <p className="text-gray-400 text-base leading-relaxed max-w-sm font-medium">
                            Pakistan's most trusted embroidery machine parts portal. We provide a premium marketplace for buying, selling and maintaining your industrial machinery with complete peace of mind.
                        </p>
                        <div className="flex gap-4 pt-2">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                <a key={i} href="#" className="w-11 h-11 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-primary/90 hover:border-primary hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 group">
                                    <Icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 lg:col-start-6">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                            Explore
                        </h4>
                        <ul className="space-y-4 text-gray-400 font-medium">
                            {['Used Parts', 'New Parts', 'Sell Your Parts', 'Technical Reviews', 'Industry News'].map((item, i) => (
                                <li key={i}>
                                    <Link href="#" className="hover:text-primary transition-all duration-300 inline-flex items-center gap-2 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-primary group-hover:scale-150 transition-all"></span>
                                        <span className="group-hover:translate-x-1 transition-transform">{item}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-3">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                            Get In Touch
                        </h4>
                        <ul className="space-y-4 font-medium">
                            <li className="flex items-start gap-4 group">
                                <div className="p-2.5 bg-white/5 backdrop-blur-sm rounded-xl text-primary border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <MapPin size={18} />
                                </div>
                                <span className="text-gray-400 text-sm leading-relaxed mt-1 group-hover:text-gray-300 transition-colors">123 Industrial Area, Canal Bank Road,<br />Faisalabad, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-4 group cursor-pointer">
                                <div className="p-2.5 bg-white/5 backdrop-blur-sm rounded-xl text-primary border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <Phone size={18} />
                                </div>
                                <span className="text-gray-400 group-hover:text-primary transition-colors">0800-SANAT-KAR</span>
                            </li>
                            <li className="flex items-center gap-4 group cursor-pointer">
                                <div className="p-2.5 bg-white/5 backdrop-blur-sm rounded-xl text-primary border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:-translate-y-1 transition-all duration-300 shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <span className="text-gray-400 group-hover:text-primary transition-colors">support@SANATkar.com</span>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-3">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                            Newsletter
                        </h4>
                        <p className="text-gray-400 mb-6 text-sm font-medium leading-relaxed">Join 50,000+ professionals getting weekly updates.</p>
                        <div className="space-y-4">
                            <div className="relative group/input">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:bg-white/10 transition-all pr-14 text-white placeholder-gray-500 font-medium"
                                />
                                <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white px-3.5 rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/40 active:scale-95 flex items-center justify-center">
                                    <Mail size={16} className="group-hover/input:animate-pulse" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/80 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                                </span>
                                No spam. Unsubscribe at any time.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 pb-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 relative">
                    <p className="text-gray-500 text-sm font-medium order-2 md:order-1">
                        © 2026 SANATKAR. Crafted with precision for manufacturing excellence.
                    </p>
                    <div className="flex gap-8 text-sm font-medium text-gray-500 order-1 md:order-2">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
