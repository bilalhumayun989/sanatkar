'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
export default function SellerListingGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 pt-32">Loading…</div>;
  if (user?.role === 'regular' && (user.total_listings_posted ?? 0) >= 3) {
    const applicationPending = user.seller_status === 'pending';
    return <main className="mx-auto min-h-screen max-w-xl px-5 pt-32 text-center">
      <h1 className="text-2xl font-bold">You’ve used your 3 free listings</h1>
      <p className="mt-4 text-slate-600">Become a seller to continue listing. Seller listings are unlimited after seller activation and admin approval.</p>
      {applicationPending
        ? <p className="mt-6 inline-block rounded-xl bg-amber-50 px-5 py-3 font-bold text-amber-700">Your seller application is under review.</p>
        : <Link href="/become-seller" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-white">Become a Seller</Link>}
      <Link href="/my-ads" className="mt-6 block text-primary underline">View my listings</Link>
    </main>;
  }
  if (user?.role === 'seller' && (!user.shop_complete || user.seller_status !== 'approved' || user.seller_activation_status !== 'approved')) {
    return <main className="mx-auto min-h-screen max-w-xl px-5 pt-32"><h1 className="text-2xl font-bold">{user.shop_complete ? 'Verify yourself to list products' : 'Create your shop first'}</h1><p className="mt-4 text-slate-600">{user.shop_complete ? 'Pay the one-time Rs 5,000 seller activation fee and attach your payment screenshot. Admin approval unlocks unlimited product listings.' : 'Complete your shop details before activating your seller account.'}</p><Link href={user.shop_complete ? '/seller-activation' : '/become-seller'} className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-white">{user.shop_complete ? 'Verify seller account' : 'Create shop'}</Link><Link href="/profile" className="mt-6 block text-primary underline">Back to profile</Link></main>;
  }
  return children;
}
