import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import prisma from '@/lib/dbConn';
import Link from 'next/link';
import { ArrowLeft, MapPin, ShieldCheck, Settings, Package, BadgeCheck, ExternalLink, ShoppingCart, Clock, Truck, Phone } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const partDoc = await prisma.car.findUnique({ where: { id } });

    if (!partDoc) return { title: 'Part Not Found | SanatKaar' };

    const title = `${partDoc.model || 'Machine Part'} - ${partDoc.make || 'Industrial'} | SanatKaar`;
    const description = partDoc.description?.substring(0, 160) || `High-quality industrial ${partDoc.model} machine part. Verified and available for immediate dispatch in Pakistan.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: partDoc.images?.[0] ? [{ url: partDoc.images[0] }] : [],
        }
    };
}


export default async function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let partDoc: any = null;
    try {
        partDoc = await prisma.car.findUnique({
            where: { id },
            include: { seller: { select: { id: true, name: true, role: true } } },
        });
    } catch (err) {
        console.error('Fetch error:', err);
    }

    if (!partDoc) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center p-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">🔍</div>
                    <h2 className="text-3xl font-black text-secondary mb-4">Part Not Found</h2>
                    <p className="text-gray-500 mb-8 font-medium">The machine part you are looking for does not exist or has been removed.</p>
                    <Link href="/buyer" className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-2">
                        <ArrowLeft size={18} /> Back to Search
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Map DB fields to UI fields
    const sellerPhoneMatch = (partDoc.model || '').match(/Phone:\s*([^|/]+?)(?:\s*\/|\s*$)/i);
    const sellerPhone = sellerPhoneMatch?.[1]?.trim() || '';

    const part = {
        id: partDoc.id,
        brand: partDoc.make || 'General',
        partName: partDoc.model || 'Machine Part',
        price: partDoc.price || 0,
        location: partDoc.location || 'Unknown',
        image: partDoc.images?.[0] || 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg',
        compatibility: partDoc.mileage || 'Universal Compatibility',
        condition: partDoc.fuelType || 'New',
        stockStatus: partDoc.transmission || 'In Stock',
        category: partDoc.category || 'Mechanical',
        description: partDoc.description || `High-performance industrial part designed for professional use. This component ensures high precision and longevity even under heavy workload.`
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <Navbar />

            <main className="flex-grow pt-24 md:pt-32 pb-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
                        <Link href="/" className="hover:text-primary transition-colors flex-shrink-0">HOME</Link>
                        <span className="opacity-30">/</span>
                        <Link href="/buyer" className="hover:text-primary transition-colors flex-shrink-0">MARKETPLACE</Link>
                        <span className="opacity-30">/</span>
                        <span className="text-gray-300 flex-shrink-0">{part.brand.toUpperCase()}</span>
                        <span className="opacity-30">/</span>
                        <span className="text-primary font-black flex-shrink-0 truncate max-w-[200px]">{part.partName.toUpperCase()}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Images & Specs */}
                        <div className="flex-1 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden group relative">
                                <div className="h-[300px] sm:h-[450px] md:h-[600px] w-full relative">
                                    <Image
                                        src={part.image}
                                        alt={part.partName}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority
                                    />
                                    <div className="absolute top-6 left-6">
                                        <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 backdrop-blur-md">
                                            <BadgeCheck size={14} /> GENUINE PART
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-8 md:p-12">
                                <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-12 text-secondary tracking-tight">Technical <span className="text-primary italic">Specifications</span></h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                                    <SpecItem label="Manufacturer" value={part.brand} icon={<Settings />} />
                                    <SpecItem label="Model" value={part.partName} icon="🏷️" />
                                    <SpecItem label="Condition" value={part.condition} icon="✨" />
                                    <SpecItem label="Category" value={part.category} icon={<Package />} />
                                    <SpecItem label="Compatibility" value={part.compatibility} icon="⚙️" />
                                    <SpecItem label="Origin" value="Global" icon="🌏" />
                                    <SpecItem label="Warranty" value="Verified Quality" icon={<ShieldCheck />} />
                                    <SpecItem label="Stock Status" value={part.stockStatus} icon="📊" />
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-8 md:p-12">
                                <h2 className="text-3xl font-black mb-6 text-secondary tracking-tight">Part <span className="text-primary">Background</span> & Details</h2>
                                <p className="text-gray-600 leading-[1.8] font-medium mb-10 text-lg">
                                    {part.description}
                                </p>

                                {/* Trust Badges */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm border border-green-100/50">
                                            <ShieldCheck size={28} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-secondary uppercase tracking-tight">Secure Payment</p>
                                            <p className="text-xs text-gray-400 font-bold">100% Protected</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50">
                                            <Truck size={28} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-secondary uppercase tracking-tight">Fast Dispatch</p>
                                            <p className="text-xs text-gray-400 font-bold">24-48 Hour Shipping</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100/50">
                                            <Clock size={28} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-secondary uppercase tracking-tight">24/7 Support</p>
                                            <p className="text-xs text-gray-400 font-bold">Expert Assistance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Contact & Price */}
                        <aside className="w-full lg:w-[400px] space-y-6">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-secondary/5 border border-gray-100 p-6 md:p-10 lg:sticky lg:top-32 mt-2 lg:mt-0">
                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Part Investment</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-primary text-xl font-black">PKR</span>
                                        <p className="text-secondary text-5xl md:text-6xl font-black tracking-tighter tabular-nums leading-none">{part.price.toLocaleString()}</p>
                                    </div>
                                    <div className="text-gray-400 text-[10px] font-bold mt-4 flex items-center gap-1.5 uppercase tracking-wider italic">
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Available for immediate dispatch
                                    </div>
                                </div>

                                <div className="p-4 bg-muted rounded-2xl mb-8 flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                                        <MapPin size={18} />
                                    </div>
                                    <p className="text-gray-600 text-sm font-bold">{part.location}, Pakistan</p>
                                </div>

                                <div className="space-y-4">
                                    <Link href={`/checkout/${id}`} className="block">
                                        <button className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary-dark transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 uppercase">
                                            <ShoppingCart size={20} /> BUY NOW
                                        </button>
                                    </Link>
                                    {sellerPhone ? (
                                        <a href={`tel:${sellerPhone}`} className="block">
                                            <button className="w-full border-2 border-primary/20 bg-primary/5 text-primary py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary/10 transition-all flex items-center justify-center gap-3 uppercase">
                                                <Phone size={20} /> {sellerPhone}
                                            </button>
                                        </a>
                                    ) : (
                                        <div className="w-full border-2 border-dashed border-gray-100 text-gray-400 py-5 rounded-[1.5rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 uppercase">
                                            <Phone size={20} /> Contact Unavailable
                                        </div>
                                    )}
                                </div>

                                <Link href={`/seller-profile/${partDoc.seller?.id || ''}`} className="mt-10 pt-10 border-t border-gray-100 flex items-center gap-5 group/seller transition-all hover:bg-gray-50/50 p-4 rounded-3xl -mx-4 cursor-pointer">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-gray-100 group-hover/seller:bg-white group-hover/seller:shadow-md transition-all">👤</div>
                                    <div>
                                        <p className="font-black text-secondary tracking-tight group-hover/seller:text-primary transition-colors flex items-center gap-2">
                                            {partDoc.seller?.role === 'admin' ? 'SanatKaar' : (partDoc.seller?.name || 'Sajid Industrial Solutions')}
                                            <ExternalLink size={12} className="opacity-0 group-hover/seller:opacity-100 transition-opacity" />
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            {partDoc.seller?.role === 'admin' ? 'Verified Platform Partner' : ''}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                    
                        </aside>
                    </div>
                </div>

                {/* Mobile Sticky Buy Bar */}
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 z-[90] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500">
                    <div>
                        <p className="text-[10px] text-gray-4   00 font-bold uppercase tracking-wider">Total Price</p>
                        <p className="text-secondary font-black text-xl tracking-tight">PKR {part.price.toLocaleString()}</p>
                    </div>
                    <Link href={`/checkout/${id}`} className="flex-1">
                        <button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm tracking-widest hover:bg-primary-dark transition-all active:scale-[0.95] shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                            <ShoppingCart size={18} /> BUY NOW
                        </button>
                    </Link>
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
