import PostListingMobile from '@/app/components/mobile/PostListingMobile';
import SellerListingGate from '@/app/components/profile/SellerListingGate';

export default function SellPage() {
  return <SellerListingGate><PostListingMobile /></SellerListingGate>;
}
