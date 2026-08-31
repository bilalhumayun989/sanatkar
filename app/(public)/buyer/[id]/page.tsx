import Image from 'next/image';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import prisma from '@/lib/dbConn';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, ShieldCheck, Settings, Package, BadgeCheck, 
  ExternalLink, Clock, Truck, Phone, Tag, Sparkles, CheckCircle2, 
  Globe, Wrench, Search, UserCheck
} from 'lucide-react';
import MakeOfferButton from '@/app/components/features/MakeOfferButton';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/auth/supabase/server';

async function loadListingOrCar(id: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (listing) {
      let sellerProfile: any = null;
      if (listing.seller_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, phone, role')
          .eq('id', listing.seller_id)
          .maybeSingle();

        if (!profileError && profile) {
          sellerProfile = profile;
        }
      }

      return {
        ...listing,
        seller: sellerProfile,
        isSupabaseListing: true,
      };
    }

    if (listingError) {
      console.warn('Supabase listing lookup failed:', listingError.message || listingError);
    }
  } catch (err) {
    console.warn('Supabase listing fetch failed:', err);
  }

  try {
    return await prisma.car.findUnique({
      where: { id },
      include: { seller: { select: { id: true, name: true, role: true } } },
    });
  } catch (err) {
    console.error('Prisma car fetch failed:', err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const partDoc = await loadListingOrCar(id);

  if (!partDoc) return { title: 'Part Not Found | SanatKaar' };

  const doc: any = partDoc;
  const title = `${doc.model || doc.title || 'Machine Part'} - ${doc.make || doc.brand || 'Industrial'} | SanatKaar`;
  const description = doc.description?.substring(0, 160) || `High-quality industrial ${doc.model || doc.title} part. Verified and available for immediate dispatch in Pakistan.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: doc.image_urls?.[0] ? [{ url: doc.image_urls[0] }] : doc.images?.[0] ? [{ url: doc.images[0] }] : [],
    }
  };
}

export default async function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let partDoc: any = null;
  try {
    partDoc = await loadListingOrCar(id);
  } catch (err) {
    console.error('Fetch error:', err);
  }

  if (!partDoc) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Part Not Found</h2>
          <p className="text-slate-500 mb-6 font-medium max-w-sm text-xs sm:text-sm">
            The machine part you are looking for does not exist or has been removed.
          </p>
          <Link 
            href="/buyer" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
          >
            <ArrowLeft size={16} /> Back to Search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const sellerPhone = partDoc.phone_number || partDoc.seller?.phone || '';
  const sellerName = partDoc.seller?.role === 'admin'
    ? 'SanatKaar'
    : partDoc.seller?.username || partDoc.seller?.name || 'Sajid Industrial Solutions';
  const sellerRoleDescription = partDoc.seller?.role === 'admin'
    ? 'Verified Platform Partner'
    : partDoc.seller?.role === 'seller'
      ? 'Trusted Seller'
      : 'Marketplace Seller';

  const images = Array.isArray(partDoc.image_urls)
    ? partDoc.image_urls.filter(Boolean)
    : Array.isArray(partDoc.images)
      ? partDoc.images.filter(Boolean)
      : [];

  const part = {
    id: partDoc.id,
    brand: partDoc.brand || partDoc.make || 'General',
    partName: partDoc.title || partDoc.model || 'Machine Part',
    price: Number(partDoc.price) || 0,
    location: partDoc.location || partDoc.city || 'Unknown',
    images,
    image: images[0] || 'https://www.har-tech.com/wp-content/uploads/2024/02/usinage-pieces-mecaniques.jpg',
    compatibility: partDoc.mileage || partDoc.hours || 'Universal Compatibility',
    condition: partDoc.condition || partDoc.fuelType || 'New',
    stockStatus: partDoc.status === 'active' ? 'In Stock' : partDoc.transmission || 'Unavailable',
    category: partDoc.category || 'Mechanical',
    description: partDoc.description || `High-performance industrial part designed for professional use. This component ensures high precision and longevity even under heavy workload.`,
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      <main className="flex-grow pt-20 sm:pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
            <Link href="/" className="hover:text-primary transition-colors flex-shrink-0">HOME</Link>
            <span className="opacity-40">/</span>
            <Link href="/buyer" className="hover:text-primary transition-colors flex-shrink-0">MARKETPLACE</Link>
            <span className="opacity-40">/</span>
            <span className="text-slate-500 flex-shrink-0">{part.brand.toUpperCase()}</span>
            <span className="opacity-40">/</span>
            <span className="text-primary font-bold flex-shrink-0 truncate max-w-[200px]">{part.partName.toUpperCase()}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Media & Details */}
            <div className="flex-1 space-y-6">
              
              {/* Product Gallery Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden relative">
                <div className="h-[280px] sm:h-[400px] md:h-[500px] w-full relative bg-slate-900">
                  <Image
                    src={part.image}
                    alt={part.partName}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 800px"
                    className="object-cover opacity-95 transition-transform duration-500 hover:scale-105"
                    priority
                  />
                </div>

                {part.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50/50 border-t border-slate-100">
                    {part.images.slice(0, 4).map((src: string, index: number) => (
                      <div key={index} className="relative h-20 overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                        <Image src={src} alt={`Thumbnail ${index + 1}`} fill sizes="200px" className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Technical Specifications
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <SpecItem label="Manufacturer" value={part.brand} icon={<Settings className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Model" value={part.partName} icon={<Tag className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Condition" value={part.condition} icon={<Sparkles className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Category" value={part.category} icon={<Package className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Compatibility" value={part.compatibility} icon={<Wrench className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Origin" value="Global" icon={<Globe className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Warranty" value="Verified Quality" icon={<ShieldCheck className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Stock Status" value={part.stockStatus} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
                </div>
              </div>

              {/* Description & Guarantee */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mb-4">
                  Part Details & Background
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-8 font-medium">
                  {part.description}
                </p>

                {/* Trust Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-emerald-100/80 rounded-lg flex items-center justify-center text-emerald-700 shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Secure Payment</p>
                      <p className="text-[11px] text-slate-500 font-medium">100% Protected</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100/80 rounded-lg flex items-center justify-center text-blue-700 shrink-0">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Fast Dispatch</p>
                      <p className="text-[11px] text-slate-500 font-medium">24-48 Hour Shipping</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 bg-purple-100/80 rounded-lg flex items-center justify-center text-purple-700 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase">24/7 Support</p>
                      <p className="text-[11px] text-slate-500 font-medium">Expert Assistance</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Pricing & Seller Contact */}
            <aside className="w-full lg:w-[380px] space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-sm lg:sticky lg:top-28">
                
                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Part Investment</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-primary text-base sm:text-lg font-black">PKR</span>
                    <p className="text-slate-900 text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none">
                      {part.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-emerald-600 text-xs font-bold mt-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Available for immediate dispatch
                  </div>
                </div>

                {/* Location */}
                <div className="p-3.5 bg-slate-50 rounded-xl mb-6 flex items-center gap-3 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-primary">
                    <MapPin size={16} />
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm font-bold">{part.location}, Pakistan</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <MakeOfferButton
                    listingId={id}
                    sellerId={partDoc.seller?.id || partDoc.sellerId || partDoc.seller_id || ''}
                    currentPrice={part.price}
                  />
                  {sellerPhone ? (
                    <a href={`tel:${sellerPhone}`} className="block">
                      <button className="w-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                        <Phone size={16} /> {sellerPhone}
                      </button>
                    </a>
                  ) : (
                    <div className="w-full border border-dashed border-slate-200 text-slate-400 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                      <Phone size={16} /> Contact Unavailable
                    </div>
                  )}
                </div>

                {/* Seller Info Footer */}
                <Link 
                  href={partDoc.seller?.id ? `/seller-profile/${partDoc.seller.id}` : '/buyer'} 
                  className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-4 group/seller transition-all hover:bg-slate-50/80 p-2.5 rounded-xl -mx-2"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 border border-slate-200/80 group-hover/seller:bg-white group-hover/seller:shadow-sm transition-all shrink-0">
                    <UserCheck size={20} className="text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 group-hover/seller:text-primary transition-colors flex items-center gap-1.5 truncate">
                      {sellerName}
                      <ExternalLink size={12} className="opacity-0 group-hover/seller:opacity-100 transition-opacity shrink-0" />
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate">
                      {sellerRoleDescription}
                    </p>
                  </div>
                </Link>

              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SpecItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
}