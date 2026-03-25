import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { mockCars } from '../../data/mockData';
import { use } from 'react';

export default function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const part = mockCars.find(c => c.id === id) || mockCars[0];

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <Navbar />

            <main className="flex-grow py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">
                        Home / Industrial Parts / {part.brand} / <span className="text-primary">{part.partName}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Images & Specs */}
                        <div className="flex-1 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden group">
                                <div className="h-[400px] md:h-[600px] w-full relative">
                                    <Image
                                        src={part.image}
                                        alt={part.partName}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl">GENUINE PART</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-10">
                                <h2 className="text-3xl font-black mb-10 text-secondary tracking-tight">Technical <span className="text-primary italic">Specifications</span></h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                    <SpecItem label="Manufacturer" value={part.brand} icon="🏭" />
                                    <SpecItem label="Model" value={part.partName} icon="🏷️" />
                                    <SpecItem label="Condition" value={part.condition || 'New'} icon="✨" />
                                    <SpecItem label="Category" value={part.category || 'Mechanical'} icon="📦" />
                                    <SpecItem label="Compatibility" value={part.compatibility || 'Universal'} icon="⚙️" />
                                    <SpecItem label="Origin" value="Japan" icon="🌏" />
                                    <SpecItem label="Warranty" value="6 Months" icon="🛡️" />
                                    <SpecItem label="Stock Status" value={part.stockStatus || 'In Stock'} icon="📊" />
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-10">
                                <h2 className="text-2xl font-black mb-6 text-secondary tracking-tight">Technical Description</h2>
                                <p className="text-gray-600 leading-relaxed font-medium">
                                    High-performance {part.brand} {part.partName} designed for industrial embroidery machines. This component ensures high precision and longevity even under heavy workload. 
                                    Compatible with {part.compatibility}. All units go through rigorous quality control before dispatch.
                                    <br /><br />
                                    For bulk orders or technical assembly support, please contact our authorized service center.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Contact & Price */}
                        <aside className="w-full lg:w-[400px] space-y-6">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-secondary/5 border border-gray-100 p-10 md:sticky md:top-24 mt-2 lg:mt-0">
                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Part Investment</p>
                                    <p className="text-secondary text-4xl font-black tracking-tighter">PKR {part.price.toLocaleString()}</p>
                                    <p className="text-gray-400 text-[10px] font-bold mt-2 flex items-center gap-1.5 uppercase tracking-wider italic">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Available for immediate dispatch
                                    </p>
                                </div>

                                <p className="text-gray-500 text-sm font-bold mb-8 flex items-center gap-2">📍 {part.location}, Pakistan</p>

                                <div className="space-y-4">
                                    <button className="w-full bg-secondary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-secondary/20">VIEW CONTACT NUMBER</button>
                                    <button className="w-full border-2 border-primary text-primary py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary/5 transition-all">SEND INQUIRY</button>
                                </div>

                                <div className="mt-10 pt-10 border-t border-gray-100 flex items-center gap-5">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-gray-100">👤</div>
                                    <div>
                                        <p className="font-black text-secondary tracking-tight">Sajid Industrial Solutions</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Seller • 12 years</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Ad */}
                            <div className="bg-[#131b2f] text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                                <div className="relative z-10">
                                    <h3 className="font-black text-2xl mb-3 tracking-tight">Need Machine <span className="text-primary italic">Servicing</span>?</h3>
                                    <p className="text-sm text-gray-400 font-medium mb-8 leading-relaxed">Book a certified technician for your {part.brand} machines starting from PKR 5,000.</p>
                                    <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">Book Technician</button>
                                </div>
                                <div className="absolute -right-6 -bottom-6 text-7xl opacity-5 rotate-12 group-hover:rotate-0 transition-all duration-700">⚙️</div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function SpecItem({ label, value, icon }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-lg">{icon}</div>
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
}
