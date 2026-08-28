import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#F3F4F6]">
            <Navbar />
            <main className="flex-grow pt-24 pb-12">
                {children}
            </main>
            <Footer />
        </div>
    );
}
