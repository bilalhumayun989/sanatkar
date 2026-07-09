import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import prisma from '@/lib/dbConn';
import Link from 'next/link';
import { ArrowLeft, Calendar, BadgeCheck } from 'lucide-react';
import PartCard from '../../components/PartCard';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await prisma.user.findUnique({ where: { id }, select: { name: true, createdAt: true } });

    if (!user) return { title: 'Seller Not Found | SanatKaar' };

    return {
        title: `${user.name} - Seller Profile | SanatKaar`,
        description: `View all industrial machine parts and equipment listed by ${user.name} on SanatKaar. Verified seller since ${new Date(user.createdAt).getFullYear()}.`,
    };
}

export default async function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let seller: any = null;
    let parts: any[] = [];

    try {
        seller = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, role: true, createdAt: true },
        });

        if (seller) {
            const rawParts = await prisma.car.findMany({
                where: { sellerId: id, status: 'available' },
                orderBy: { createdAt: 'desc' },
            });

            parts = rawParts.map((item) => ({
                id: item.id,
                brand: item.make || 'General',
                partName: item.model || 'Machine Part',
                price: item.price || 0,
                location: item.location || 'Unknown',
                image: item.images?.[0] || 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg',
                compatibility: item.mileage || 'Universal',
                condition: item.fuelType || 'New',
                stockStatus: item.transmission || 'In Stock',
                isFeatured: item.isFeatured,
                sellerRole: seller.role,
                category: item.category || 'Mechanical',
                createdAt: item.createdAt?.toISOString(),
            }));
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }

    if (!seller) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
                <Navbar forceSolid />
                <div className="flex-grow flex flex-col items-center justify-center p-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">👤</div>
                    <h2 className="text-3xl font-black text-secondary mb-4">Seller Not Found</h2>
                    <p className="text-gray-500 mb-8 font-medium">The seller profile you are looking for does not exist or has been removed.</p>
                    <Link href="/buyer" className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-2">
                        <ArrowLeft size={18} /> Back to Marketplace
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const joinDate = new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <Navbar forceSolid />

            <main className="flex-grow pt-24 md:pt-32 pb-16 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                        <Link href="/" className="hover:text-primary transition-colors">HOME</Link>
                        <span>/</span>
                        <Link href="/buyer" className="hover:text-primary transition-colors">MARKETPLACE</Link>
                        <span>/</span>
                        <span className="text-primary">SELLER PROFILE</span>
                    </div>

                    {/* Profile Header */}
                    <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 overflow-hidden mb-12">
                        <div className="relative h-32 md:h-48 bg-secondary overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/40 backdrop-blur-3xl"></div>
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg')] bg-cover bg-center grayscale"></div>
                        </div>
                        <div className="px-6 md:px-12 pb-10 -mt-16 md:-mt-20 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                                    <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-5xl border-4 border-white">
                                        {seller.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="mb-2">
                                        <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                                            <h1 className="text-3xl md:text-4xl font-black text-secondary tracking-tight">{seller.name}</h1>
                                            {seller.role === 'admin' && (
                                                <div className="p-1 px-3 bg-primary/10 text-primary rounded-full flex items-center gap-1.5" title="Verified Platform Partner">
                                                    <BadgeCheck size={16} />
                                                    <span className="text-[10px] font-black uppercase">PARTNER</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2 justify-center md:justify-start">
                                            <Calendar size={14} className="text-primary" /> Member Since {joinDate}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                    <StatItem label="Active Ads" value={parts.length.toString()} />
                                    <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                                    <StatItem label="Response Rate" value="98%" />
                                    <div className="w-px h-10 bg-gray-200 hidden sm:block"></div>
                                    <StatItem label="Sold Parts" value="120+" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Listings Section */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-secondary tracking-tight">
                                Seller <span className="text-primary italic">Inventory</span>
                            </h2>
                            <p className="text-gray-400 text-sm font-medium">Browse all verified listings from this seller.</p>
                        </div>
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Total Listings: {parts.length}</span>
                        </div>
                    </div>

                    {parts.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] shadow-premium border border-gray-100 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📦</div>
                            <h3 className="text-xl font-black text-secondary mb-2">No Active Listings</h3>
                            <p className="text-gray-500 font-medium">This seller doesn&apos;t have any active listings at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                            {parts.map((p, idx) => (
                                <div key={p.id} className="reveal-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <PartCard part={p as any} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="px-4 text-center sm:text-left">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-black text-secondary tracking-tight">{value}</p>
        </div>
    );
}
