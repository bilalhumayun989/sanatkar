import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
            <Navbar />
            <main className="flex-grow pt-0 pb-12">
                {children}
            </main>
            <Footer />
        </div>
    );
}
