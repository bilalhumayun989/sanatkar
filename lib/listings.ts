import 'server-only';
import type { Prisma } from '@prisma/client';

export const listingSellerSelect = {
  id: true,
  username: true,
  phone: true,
  fullName: true,
  role: true,
  city: true,
  shopName: true,
} as const;

export type ListingRecord = Prisma.ListingGetPayload<{
  include: { seller: { select: typeof listingSellerSelect } };
}>;

export function serializeListing(item: ListingRecord) {
  return {
    id: item.id,
    title: item.title,
    brand: item.brand,
    category: item.category,
    price: Number(item.price),
    location: item.location,
    description: item.description,
    image_urls: item.imageUrls ?? [],
    year: item.year,
    hours: item.hours,
    condition: item.condition,
    seller_id: item.sellerId,
    status: item.status,
    model: item.model,
    origin: item.origin,
    stock_status: item.stockStatus,
    phone_number: item.phoneNumber,
    contact_option: item.contactOption,
    is_featured: item.isFeatured,
    created_at: item.createdAt?.toISOString() ?? null,
    ...(item.seller ? {
      seller: {
        id: item.seller.id,
        username: item.seller.username,
        phone: item.seller.phone,
        full_name: item.seller.fullName,
        role: item.seller.role,
        city: item.seller.city,
        shop_name: item.seller.shopName,
      },
    } : {}),
  };
}

export function parseImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0 && item.length <= 2048 && /^(https:\/\/|\/)/i.test(item))
    .slice(0, 12);
}
