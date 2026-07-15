'use client';

import Navbar from './components/Navbar';
import { useState, useEffect } from 'react';
import Footer from './components/Footer';
import PartCard from './components/PartCard';
import { mockCars } from './data/mockData';
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Zap,
  Star,
  Phone,
  Package,
  Heart,
  CheckCircle2,
  LayoutGrid,
  Settings,
  Activity,
  Cpu,
  Box,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';

const PART_IMG = 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg';

export default function Home() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();

  const [popularCategories, setPopularCategories] = useState<any[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetch('/api/categories')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setPopularCategories(data.categories.filter((c: any) => c.isPopular).slice(0, 5));
        }
      })
      .catch(err => console.error('Failed to fetch categories:', err));
  }, []);

  const filterTabs = ['All Collections'];

  const browseCategories = [
    { name: 'Hooks & Rotaries', icon: <Settings size={22} />, count: '850+' },
    { name: 'Needles', icon: <Zap size={22} />, count: '2,100+' },
    { name: 'Motors', icon: <Activity size={22} />, count: '430+' },
    { name: 'Machine Heads', icon: <Cpu size={22} />, count: '1,240+' },
    { name: 'Sensors', icon: <Box size={22} />, count: '310+' },
    { name: 'Belts & Gears', icon: <Layers size={22} />, count: '670+' },
  ];

  const topBrands = ['Tajima', 'Barudan', 'ZSK', 'Brother', 'SWF', 'Happy'];

  return (

    <>
      <div className="min-h-screen flex flex-col bg-[#F3F4F6] p-0">
        <main className="flex-grow">
          <div className="relative w-full h-[100vh] min-h-[600px] rounded-[0px] overflow-hidden">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative w-full h-full flex items-end ">
              <div className="absolute inset-0 z-0">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/50 via-black/10 to-black/5"></div>

                <img
                  src="https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg"
                  alt="Industrial parts"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-20">
                <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="max-w-2xl text-left">
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-xl px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] mb-5 sm:mb-6 text-white shadow-[0_8px_32px_rgba(255,255,255,0.08)]">
                      {t('verified_industrial_parts')}
                    </span>
                    <div className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-black text-white leading-[0.95] tracking-[-0.03em] mb-6 sm:mb-8">
                      {t('hero_title_1')} <br className="hidden md:block" /> {t('hero_title_2')}
                    </div>
                    <p className="text-white/90 text-sm sm:text-base md:text-lg mb-8 sm:mb-10 leading-relaxed max-w-xl font-medium">
                      {t('hero_desc')}
                    </p>

                    <div className="w-full max-w-3xl rounded-[28px] border border-white/15 bg-white/10 backdrop-blur-2xl p-3 sm:p-4 shadow-[0_20px_70px_rgba(0,0,0,0.3)]">
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70" />
                          <input
                            type="text"
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            placeholder="Search part name or category"
                            className="w-full rounded-2xl border border-white/15 bg-black/20 pl-12 pr-4 py-3.5 text-sm font-semibold text-white placeholder:text-white/60 outline-none transition focus:border-white/50 focus:bg-black/30"
                          />
                        </div>
                        <Link
                          href={brandSearch ? `/buyer?search=${encodeURIComponent(brandSearch)}` : '/buyer'}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-dark"
                        >
                          <span>{t('show_parts')}</span>
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* <div className="hidden lg:flex justify-center">
                    <div className="relative w-full max-w-[430px] rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/20 via-transparent to-primary/20" />
                      <div className="relative overflow-hidden rounded-[24px] border border-white/15">
                        <img
                          src="https://images.unsplash.com/photo-1621383650959-808079fc5861?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                          alt="Premium industrial parts"
                          className="h-[320px] w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-md">
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
                            <ShieldCheck size={14} /> Genuine Industrial Parts
                          </div>
                          <div className="mt-2 text-xl font-black text-white">Fast sourcing for modern factories</div>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </section>


          </div>


          {/* Browse Categories */}
          <section className="container-wide py-12 md:py-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8 md:mb-10">
              <div className="max-w-2xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary text-white px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] mb-4">
                  Browse Categories
                </span>

                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  Explore Categories
                </h2>

                <p className="mt-3 md:mt-4 text-sm sm:text-base text-gray-500">
                  Find industrial machinery, spare parts and equipment from verified suppliers.
                </p>
              </div>

              <Link
                href="/buyer"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-primary/20 bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105"
              >
                View All Categories
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                "Industrial Machinery",
                "Textile Parts",
                "Electric Motors",
                "Bearings",
                "Hydraulic Parts",
              ].map((category) => (
                <Link
                  key={category}
                  href={`/buyer?category=${encodeURIComponent(category)}`}
                  className="group relative overflow-hidden rounded-3xl h-[220px] sm:h-[280px] lg:h-[340px]"
                >
                  <img
                    src={PART_IMG}
                    alt={category}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-5 left-5 right-5 z-10">
                    <span className="inline-flex rounded-full border border-white/20 bg-white/10 backdrop-blur-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Category
                    </span>

                    <div className="mt-3 text-lg sm:text-xl font-black leading-tight text-white">
                      {category}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>








          {/* Stats strip */}
          <section className="relative overflow-hidden py-12 md:py-20">
            <div className="container-wide relative z-10">

              {/* Heading */}
              <div className="mb-10 md:mb-14 max-w-3xl">
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-white shadow-lg">
                  Platform Statistics
                </span>

                <h2 className="mt-4 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-black leading-tight">
                  Trusted by the Industrial Community
                </h2>

                <p className="mt-4 text-sm sm:text-base text-gray-500">
                  Thousands of buyers and sellers trust SanatHub to find genuine
                  industrial machinery and spare parts across Pakistan.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

                {[
                  {
                    label: t("listed_parts"),
                    value: "15,000+",
                    icon: <Package size={24} />,
                  },
                  {
                    label: t("happy_clients"),
                    value: "12K+",
                    icon: <Heart size={24} />,
                  },
                  {
                    label: t("genuine_products"),
                    value: "100%",
                    icon: <CheckCircle2 size={24} />,
                  },
                  {
                    label: t("active_ads"),
                    value: "2,500+",
                    icon: <LayoutGrid size={24} />,
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl p-5 sm:p-6 md:p-7 shadow-[0_15px_45px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
                  >
                    {/* Glow */}
                    <div className="absolute -top-10 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Icon */}
                    <div className="relative z-10 flex h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
                      {stat.icon}
                    </div>

                    {/* Value */}
                    <h3 className="relative z-10 mt-4 sm:mt-5 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black">
                      {stat.value}
                    </h3>

                    {/* Label */}
                    <p className="relative z-10 mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-gray-500 leading-relaxed">
                      {stat.label}
                    </p>
                  </div>
                ))}

              </div>
            </div>
          </section>



          {/* PROMO TILES — three cards overlapping the hero rhythm, one flat wordmark panel */}
          <section className="container-wide py-10 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Card 1 */}
              <div className="relative h-[380px] rounded-3xl overflow-hidden group">
                <img
                  src="https://plus.unsplash.com/premium_photo-1682144748274-add3d8ed04ea?q=80&w=1434&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Industrial Parts"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 p-6">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg">
                    Verified Parts
                  </span>

                  <div className="text-[#ffffff] text-3xl font-black mt-2 leading-tight">
                    Genuine Industrial <br /> Spare Parts
                  </div>

                  <Link
                    href="/buyer"
                    className="inline-flex mt-5 rounded-full bg-primary text-white font-bold text-sm px-5 py-2.5 hover:bg-primary-dark transition"
                  >
                    Browse Parts
                  </Link>
                </div>
              </div>

              {/* Card 2 */}
              <div className="relative h-[380px] rounded-3xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1565377167263-d29b5ac85479?q=80&w=388&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Suppliers"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 p-6">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg">
                    Trusted Sellers
                  </span>

                  <div className="text-white text-3xl font-black mt-2 leading-tight">
                    Connect With <br /> Reliable Suppliers
                  </div>

                  <Link
                    href="/seller"
                    className="inline-flex mt-5 rounded-full bg-primary text-white font-bold text-sm px-5 py-2.5 hover:bg-primary-dark transition"
                  >
                    Sell Your Parts
                  </Link>
                </div>
              </div>

              {/* Card 3 */}
              <div className="relative overflow-hidden rounded-3xl p-7 flex flex-col justify-between min-h-[380px] bg-[#000]">

                <div>
                  <span className="text-white/70 text-xs uppercase tracking-[0.2em] font-semibold">
                    SANATHUB
                  </span>

                  <div className="text-white text-3xl font-black mt-3 leading-tight">
                    Pakistan's Industrial Marketplace
                  </div>

                  <p className="text-white/80 mt-4 text-sm leading-7">
                    Buy genuine machine parts, connect with verified suppliers,
                    and grow your industrial business through one trusted platform.
                  </p>
                </div>

                <Link
                  href="/buyer"
                  className="inline-flex self-start rounded-full bg-primary text-white font-bold text-sm px-5 py-2.5 hover:bg-primary-dark transition"
                >
                  Explore Marketplace
                </Link>
              </div>

            </div>
          </section>




          {/* JUST DROPPED — filterable product grid */}
          <section className="container-wide py-12 md:py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 px-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-black/10 bg-primary text-white backdrop-blur-xl px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-700 mb-4">
                  Featured Collection
                </span>

                <h2 className="text-2xl md:text-4xl font-extrabold text-black tracking-tight mb-2">
                  Just Dropped Collections
                </h2>

                <p className="text-sm text-gray-500 max-w-lg">
                  {t('hero_desc')}
                </p>
              </div>

              <div className="flex shrink-0">
                <Link
                  href="/buyer"
                  className="rounded-full border border-primary bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:bg-primary-dark hover:shadow-md"
                >
                  All Categories
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCars.slice(0, 6).map((part) => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>

          </section>








          {/* NEW ERA / Browse by Category */}
          {/* <section className="py-16 md:py-20 bg-gray-50 border-y border-gray-200">
          <div className="container-wide">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
              <h2 className="text-2xl md:text-4xl font-extrabold text-black tracking-tight">Browse by Category</h2>
              <Link href="/buyer" className="flex items-center gap-2 text-sm font-bold text-black hover:text-gray-500 transition-colors group">
                View All Categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
              {browseCategories.map((cat, i) => (
                <Link
                  href={`/buyer?category=${cat.name}`}
                  key={i}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-black/40 transition-colors flex flex-col items-center text-center"
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-black transition-colors">
                    <div className="text-gray-500 group-hover:text-white transition-colors">{cat.icon}</div>
                  </div>
                  <h3 className="text-sm font-bold text-black mb-1">{cat.name}</h3>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{cat.count} Items</p>
                </Link>
              ))}
            </div>

            <div className="mt-14 pt-10 border-t border-gray-200">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">Trusted by Top Brands</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                {topBrands.map((brand, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-center hover:border-black/40 transition-colors">
                    <span className="text-base md:text-lg font-black text-gray-300 hover:text-black transition-colors tracking-tight">{brand}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section> */}

          {/* Why choose us — flat feature cards */}
          <section className="container-wide py-16 md:py-20">
            <div className="max-w-xl mb-12 space-y-3">
              <h2 className="text-2xl md:text-4xl font-extrabold text-black tracking-tight">{t('why_buy_with_sanatkar')}</h2>
              <p className="text-gray-500 text-sm md:text-base">{t('why_buy_desc')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {[
                { title: t('feat_1_title'), desc: t('feat_1_desc'), icon: <ShieldCheck size={24} /> },
                { title: t('feat_2_title'), desc: t('feat_2_desc'), icon: <Zap size={24} /> },
                { title: t('feat_3_title'), desc: t('feat_3_desc'), icon: <Settings size={24} /> },
              ].map((feat, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-7">
                  <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mb-6">
                    {feat.icon}
                  </div>
                  <h3 className="font-black text-black mb-2 text-lg tracking-tight">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>


        </main>

      </div>
      <Footer />

    </>
  );
}