import prisma from '@/lib/dbConn';
import { listingSellerSelect, serializeListing } from '@/lib/listings';
import HomeClient, { type Listing } from './HomeClient';

export const dynamic = 'force-dynamic';

async function getRecentListings(): Promise<Listing[]> {
  try {
    const deletedAccounts = await prisma.deletedAccount.findMany({ select: { userId: true } });
    const rows = await prisma.listing.findMany({
      where: {
        status: 'active',
        ...(deletedAccounts.length ? { sellerId: { notIn: deletedAccounts.map(account => account.userId) } } : {}),
      },
      include: { seller: { select: listingSellerSelect } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    return rows.map(row => serializeListing(row));
  } catch (error) {
    console.error('Failed to load initial storefront listings:', error);
    return [];
  }
}

export default async function Page() {
  const initialListings = await getRecentListings();
  return <HomeClient initialListings={initialListings} />;
}
