import 'server-only';

import { cache } from 'react';
import prisma from '@/lib/dbConn';
import { listingSellerSelect, serializeListing } from '@/lib/listings';
import { FIXED_CATEGORY_OPTIONS } from '@/lib/categoryConstants';

export const getHomeData = cache(async () => {
  try {
    const deletedAccounts = await prisma.deletedAccount.findMany({ select: { userId: true } });
    const excludedSellers = deletedAccounts.length
      ? { sellerId: { notIn: deletedAccounts.map(account => account.userId) } }
      : {};
    const [categoryRows, brandRows, shopProfiles, sellerProfiles, recentRows, featuredRows] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.profile.findMany({ where: { role: 'seller', sellerStatus: 'approved' }, select: { id: true, username: true, fullName: true, shopName: true, shopImageUrl: true, verificationStatus: true }, orderBy: [{ shopName: 'asc' }, { id: 'asc' }], take: 12 }),
      prisma.profile.findMany({ where: { role: 'seller', verificationStatus: 'approved' }, select: { id: true, fullName: true, username: true, shopName: true, shopImageUrl: true }, orderBy: [{ shopName: 'asc' }, { id: 'asc' }] }),
      prisma.listing.findMany({ where: { status: 'active', ...excludedSellers }, include: { seller: { select: listingSellerSelect } }, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.listing.findMany({ where: { status: 'active', isFeatured: true, ...excludedSellers }, include: { seller: { select: listingSellerSelect } }, orderBy: { createdAt: 'desc' }, take: 6 }),
    ]);
    const categories = categoryRows.length ? categoryRows.map(category => ({
      id: category.id, name: category.name,
      slug: category.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      icon_code: category.iconCode, image_url: category.imageUrl, description: category.description,
      is_active: category.isActive, is_popular: category.isPopular,
    })) : FIXED_CATEGORY_OPTIONS.map(item => ({ id: item.value, name: item.label, slug: item.value, icon_code: null, image_url: null, description: null, is_active: true, is_popular: false }));
    return {
      categories,
      brands: brandRows.map(brand => ({ id: brand.id, name: brand.name, logo_url: brand.logoUrl })),
      shops: shopProfiles.map(profile => ({ id: profile.id, seller_id: profile.id, title: profile.shopName || profile.fullName || profile.username, image_urls: profile.shopImageUrl ? [profile.shopImageUrl] : [], verification_status: profile.verificationStatus })),
      verifiedSellers: sellerProfiles.map(profile => ({ id: profile.id, full_name: profile.fullName, username: profile.username, avatar_url: null, shop_name: profile.shopName, shop_image_url: profile.shopImageUrl })),
      recentListings: recentRows.map(serializeListing),
      featuredListings: featuredRows.map(serializeListing),
    };
  } catch (error) {
    console.error('Failed to load home page data:', error);
    return {
      categories: FIXED_CATEGORY_OPTIONS.map(item => ({ id: item.value, name: item.label, slug: item.value, icon_code: null, image_url: null, description: null, is_active: true, is_popular: false })),
      brands: [], shops: [], verifiedSellers: [], recentListings: [], featuredListings: [],
    };
  }
});
