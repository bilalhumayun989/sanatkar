import type { Metadata } from "next";
import { Arimo, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/layout/BottomNav";
import MobileHeader from "@/app/components/layout/MobileHeader";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/lib/AuthContext";

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sanatkar",
  description: "Your trusted marketplace for automotive parts and industrial inventory",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '16x16' }
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body
        className={`${arimo.variable} ${arimo.className} antialiased min-h-full flex flex-col relative overflow-x-hidden pb-16 lg:pb-0`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <MobileHeader />
            <main className="flex-1 w-full pt-0 lg:pt-0">{children}</main>
            <BottomNav />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}