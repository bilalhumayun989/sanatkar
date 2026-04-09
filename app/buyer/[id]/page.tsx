import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import dbConnect from '@/lib/dbConn';
import Car from '@/lib/models/Car';
import Link from 'next/link';
import { ArrowLeft, MapPin, ShieldCheck, Settings, Package, BadgeCheck } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    await dbConnect();
    const partDoc: any = await Car.findById(id).lean();
    
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
    await dbConnect();
    const { id } = await params;
    
    let partDoc;
    try {
        partDoc = await Car.findById(id).lean();
    } catch (err) {
        console.error('Fetch error:', err);
    }

    if (!partDoc) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <Navbar forceSolid />
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
    const part = {
        id: partDoc._id.toString(),
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
            <Navbar forceSolid />

            <main className="flex-grow pt-32 pb-8 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Link href="/" className="hover:text-primary transition-colors">HOME</Link> 
                        <span>/</span> 
                        <Link href="/buyer" className="hover:text-primary transition-colors">INDUSTRIAL PARTS</Link> 
                        <span>/</span> 
                        {part.brand.toUpperCase()} 
                        <span>/</span> 
                        <span className="text-primary">{part.partName.toUpperCase()}</span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column: Images & Specs */}
                        <div className="flex-1 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden group relative">
                                <div className="h-[400px] md:h-[600px] w-full relative">
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

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-10">
                                <h2 className="text-3xl font-black mb-10 text-secondary tracking-tight">Technical <span className="text-primary italic">Specifications</span></h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
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

                            <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-10">
                                <h2 className="text-2xl font-black mb-6 text-secondary tracking-tight">Technical Description</h2>
                                <p className="text-gray-600 leading-relaxed font-medium">
                                    {part.description}
                                    <br /><br />
                                    For bulk orders or technical assembly support, please contact our authorized industrial solutions team. All units go through rigorous quality control before dispatch.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Contact & Price */}
                        <aside className="w-full lg:w-[400px] space-y-6">
                            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-secondary/5 border border-gray-100 p-10 md:sticky md:top-32 mt-2 lg:mt-0">
                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Part Investment</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-secondary text-base font-bold">PKR</span>
                                        <p className="text-secondary text-5xl font-black tracking-tighter">{part.price.toLocaleString()}</p>
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
                                    <button className="w-full bg-secondary text-white py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-secondary/20">VIEW CONTACT NUMBER</button>
                                    <Link href="/contact" className="block">
                                        <button className="w-full border-2 border-primary text-primary py-5 rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-primary/5 transition-all">SEND INQUIRY</button>
                                    </Link>
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
