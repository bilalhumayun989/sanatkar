import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f7f9f9]"><Navbar forceSolid /><div className="pt-32 lg:pt-16">{children}</div><Footer /></div>;
}
