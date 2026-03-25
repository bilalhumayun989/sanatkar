'use client';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PartCard from './components/PartCard';
import { mockCars } from './data/mockData';
import { ArrowRight, Search, Filter, ShieldCheck, Zap, Star, Phone, Package, Heart, CheckCircle2, LayoutGrid, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow pt-20">
        {/* New Hero Section - Contained and Responsive */}
        <section className="container-wide py-8 md:py-12">
          <div className="relative h-[70vh] md:h-[80vh] min-h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl shadow-secondary/20">
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0 scale-105 animate-pulse-slow">
              <div className="absolute inset-0 bg-gradient-to-tr from-secondary/100 via-secondary/70 to-transparent z-10" />
              <img
                src="https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg"
                alt="Industrial Machine Parts"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute inset-0 z-20 flex items-center p-8 md:p-20">
              <div className="max-w-2xl reveal-up">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-2.5 rounded-2xl mb-8">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                  <span className="text-white text-xs font-bold uppercase tracking-[0.2em]">Verified Industrial Parts</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] tracking-tighter text-white">
                  <span className="text-primary">Stitch The</span> <br />
                  <span className="text-primary italic underline decoration-primary/30 underline-offset-[12px] decoration-8">Future</span>
                </h1>
                <p className="text-base md:text-lg lg:text-xl text-gray-200 mb-10 leading-relaxed font-medium max-w-lg">
                  Pakistan's most exclusive marketplace for premium embroidery machine parts. Buy, sell, and discover industrial excellence.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Link href="/buyer" className="btn-primary w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg group flex items-center justify-center">
                    <Search size={22} className="group-hover:scale-110 transition-transform" />
                    Browse Parts <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/seller" className="btn-secondary glass w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg group border-white/20 text-white hover:bg-white hover:text-secondary flex items-center justify-center">
                    <Zap size={22} className="text-primary group-hover:scale-125 transition-transform" />
                    List Your Parts
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-16 pt-12 border-t border-white/10 flex flex-wrap gap-8 items-center opacity-70">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck size={20} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Genuine Parts</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Star size={20} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest">Top Rated Suppliers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Standalone Filter Bar Section */}
        <section className="relative z-30 -mt-16 md:-mt-24 container-wide">
          <div className="bg-white rounded-3xl shadow-xl shadow-secondary/5 border border-border p-6 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-muted rounded-xl text-primary"><Filter size={20} /></div>
              <h2 className="text-xl font-bold">Find Specific Parts</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Brand / Part Name</label>
                <div className="relative group">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-all duration-300" />
                  <input
                    type="text"
                    placeholder="Search e.g. Tajima Hook"
                    className="w-full pl-14 pr-4 py-4.5 rounded-2xl bg-muted border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all text-sm font-semibold placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Supplier Location</label>
                <div className="relative border-none">
                  <select className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-semibold appearance-none">
                    <option>All Cities</option>
                    <option>Faisalabad</option>
                    <option>Lahore</option>
                    <option>Karachi</option>
                    <option>Islamabad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Price Range</label>
                <select className="w-full p-4 rounded-2xl bg-muted border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-semibold appearance-none">
                  <option>Under 5,000</option>
                  <option>5,000 - 20,000</option>
                  <option>20,000 - 50,000</option>
                  <option>Above 50,000</option>
                </select>
              </div>

              <button className="btn-primary w-full py-4 rounded-2xl">
                Show Parts
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-3 items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">Trending:</span>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary/5 text-primary border border-primary/10 hover:bg-primary hover:text-white transition-all shadow-sm">
                <Package size={14} /> Critical Hooks
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm">
                Tajima Rotary
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm">
                Janome Needles
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-100 hover:border-primary hover:text-primary transition-all shadow-sm">
                Main Belts
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted/30">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: 'Listed Parts', value: '15,000+', icon: <Package className="text-primary" size={32} /> },
                { label: 'Happy Clients', value: '12k+', icon: <Heart className="text-primary" size={32} /> },
                { label: 'Genuine Products', value: '100%', icon: <CheckCircle2 className="text-primary" size={32} /> },
                { label: 'Active Ads', value: '2,500+', icon: <LayoutGrid className="text-primary" size={32} /> }
              ].map((stat, i) => (
                <div key={i} className="text-center space-y-4 reveal-up flex flex-col items-center" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-secondary tracking-tight">{stat.value}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="py-24 container-wide overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6 reveal-up">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded-full" />
                <span className="text-primary text-xs font-bold uppercase tracking-widest">Handpicked Selection</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-black">
                New Arrivals <span className="text-primary">Parts</span>
              </h2>
            </div>
            <Link href="/buyer" className="btn-ghost flex items-center gap-2 group">
              Explore All Parts <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 reveal-up stagger-1">
            {mockCars.slice(0, 6).map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-24 bg-secondary relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          <div className="container-wide relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-4xl font-extrabold text-white">Why Buy With SANATKAR?</h2>
              <p className="text-gray-400">Discover why thousands of manufacturing units choose us daily for their embroidery needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: 'Verified Quality',
                  desc: 'Every part listing is checked by our technical team for authenticity and specification.',
                  icon: <ShieldCheck size={32} />
                },
                {
                  title: 'Fast Deployment',
                  desc: 'Minimize downtime with quick connections to the best suppliers in the market.',
                  icon: <Zap size={32} />
                },
                {
                  title: 'Technical Support',
                  desc: 'Expert guidance on part compatibility and installation for all major brands.',
                  icon: <Settings size={32} />
                }
              ].map((feat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-primary/30 transition-all duration-500 group relative">
                  {/* Decorative background number */}
                  <span className="absolute top-6 right-10 text-8xl font-black text-white/[0.05] pointer-events-none group-hover:text-primary/10 transition-colors">0{i + 1}</span>

                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[1.25rem] flex items-center justify-center mb-10 shadow-xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {feat.icon}
                  </div>
                  <h3 className="text-2xl font-black !text-white mb-4 group-hover:!text-primary transition-colors tracking-tight drop-shadow-sm group-hover:drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]">{feat.title}</h3>
                  <p className="text-gray-400/90 leading-relaxed font-medium">{feat.desc}</p>

                  {/* Bottom indicator */}
                  <div className="mt-8 h-1 w-0 bg-primary group-hover:w-12 transition-all duration-500 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-24 container-wide">
          <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                Want to Sell Your Spare Parts?<br />
                Get Best Quotes Today.
              </h2>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                List your components for free and get access to over 50,000 potential buyers nationwide.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/seller" className="btn-secondary px-12 py-5 rounded-2xl text-lg group bg-white text-primary border-none hover:bg-white hover:scale-105 shadow-2xl shadow-black/20">
                  <Package size={22} className="group-hover:rotate-12 transition-transform" />
                  List Your Parts <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <p className="text-white font-bold flex items-center gap-2">
                  <Phone size={20} /> Or Call SANATKAR Support
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
