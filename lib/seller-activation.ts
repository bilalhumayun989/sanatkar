export const SELLER_ACTIVATION_FEE = 5000;
export function hasCompleteShop(profile: { shopName?: string | null; shopDescription?: string | null; shopAddress?: string | null; city?: string | null; shopImageUrl?: string | null; phone?: string | null; cnic?: string | null }) {
  return [profile.shopName, profile.shopDescription, profile.shopAddress, profile.city, profile.shopImageUrl, profile.phone, profile.cnic].every(value => Boolean(value?.trim()));
}
export function sellerListingGate(profile: { role: string; sellerStatus?: string | null; sellerActivationStatus?: string; shopName?: string | null; shopDescription?: string | null; shopAddress?: string | null; city?: string | null; shopImageUrl?: string | null; phone?: string | null; cnic?: string | null }) {
  if (profile.role !== 'seller' && profile.role !== 'professional') return null;
  if (!hasCompleteShop(profile)) return 'SHOP_REQUIRED';
  return profile.sellerStatus === 'approved' && profile.sellerActivationStatus === 'approved' ? null : 'SELLER_ACTIVATION_REQUIRED';
}
export function sellerPaymentDetails() {
  const iban = process.env.SELLER_PAYMENT_IBAN?.trim();
  const jazzCashPhone = process.env.SELLER_PAYMENT_JAZZCASH_PHONE?.trim();
  return { amount: SELLER_ACTIVATION_FEE, currency: 'PKR',
    account_title: process.env.SELLER_PAYMENT_ACCOUNT_TITLE?.trim() || 'SANATKAR (demo)',
    iban: iban || 'PK00 DEMO 0000 0000 0000 0000',
    jazzcash_phone: jazzCashPhone || '0300-XXXXXXX',
    demo: !iban || !jazzCashPhone,
  };
}
