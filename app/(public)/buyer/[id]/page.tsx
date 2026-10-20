import ProductGallery from '@/app/components/features/ProductGallery';
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
import { listingSellerSelect, serializeListing } from '@/lib/listings';

async function loadListingOrCar(id: string) {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: { select: listingSellerSelect } },
    });
    return listing ? serializeListing(listing) : null;
  } catch (err) {
    console.error('Prisma listing fetch failed:', err);
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
    : partDoc.seller?.username || partDoc.seller?.name || 'Marketplace seller';
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
    image: images[0] || '/placeholder.png',
    model: partDoc.model || 'Not specified',
    year: partDoc.year == null ? 'Not specified' : String(partDoc.year),
    hours: partDoc.hours == null ? 'Not specified' : String(partDoc.hours),
    origin: partDoc.origin || 'Not specified',
    condition: partDoc.condition || 'Not specified',
    stockStatus: partDoc.stock_status || 'Not specified',
    category: partDoc.category || 'Mechanical',
    description: partDoc.description || 'No description provided.',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-slate-800">
      <Navbar />

      <main className="flex-grow pt-36 lg:pt-28 pb-16 px-4">
        <div className="max-w-[1100px] mx-auto">
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

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            {/* Left Column: Media & Details */}
            <div className="contents">
              
              <div className="order-1 lg:col-start-1"><ProductGallery images={part.images} title={part.partName} /></div>

              {/* Product specifications */}
              <div className="order-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-start-1">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Technical Specifications
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SpecItem label="Manufacturer" value={part.brand} icon={<Settings className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Model" value={part.model} icon={<Tag className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Condition" value={part.condition} icon={<Sparkles className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Category" value={part.category} icon={<Package className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Hours" value={part.hours} icon={<Wrench className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Origin" value={part.origin} icon={<Globe className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Year" value={part.year} icon={<ShieldCheck className="w-4 h-4 text-primary" />} />
                  <SpecItem label="Stock Status" value={part.stockStatus} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
                </div>
              </div>

              {/* Description & Guarantee */}
              <div className="order-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-start-1">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight mb-4">
                  About this product
                </h2>
                <p className="whitespace-pre-wrap text-slate-600 text-sm leading-7">
                  {part.description}
                </p>


              </div>

            </div>

            {/* Right Column: Pricing & Seller Contact */}
            <aside className="order-2 w-full lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-24">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{part.brand}</p>
                  <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-900">{part.partName}</h1>
                  <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">{part.condition}</span><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">{part.category}</span></div>
                </div>
                {/* Price Display */}
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asking price</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-primary text-base sm:text-lg font-black">PKR</span>
                    <p className="text-slate-900 text-2xl sm:text-3xl font-bold break-words tracking-tight tabular-nums leading-none">
                      {part.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-slate-500 text-xs font-bold mt-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full" /> {partDoc.status === 'active' ? 'Active listing' : partDoc.status === 'sold' ? 'Sold' : 'Listing unavailable'}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4 flex items-center gap-2 text-slate-500">
                  <div className="text-primary">
                    <MapPin size={16} />
                  </div>
                  <p className="text-slate-700 text-xs sm:text-sm font-bold">{part.location}</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <MakeOfferButton
                    listingId={id}
                    sellerId={partDoc.seller?.id || partDoc.sellerId || partDoc.seller_id || ''}
                    currentPrice={part.price}
                    compact
                  />
                  {sellerPhone ? (
                    <a href={`tel:${sellerPhone}`} className="block">
                      <button className="w-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary py-3 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
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
                  href={(partDoc.seller_id || partDoc.seller?.id || partDoc.sellerId) ? `/shop/${partDoc.seller_id || partDoc.seller?.id || partDoc.sellerId}` : '/buyer'}
                  className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 group/seller transition-colors hover:text-primary"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 border border-slate-200/80 group-hover/seller:bg-white group-hover/seller:shadow-sm transition-all shrink-0">
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
        <p className="text-sm font-semibold text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}
