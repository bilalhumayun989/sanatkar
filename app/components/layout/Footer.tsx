// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { Mail } from 'lucide-react';

// const columns = [
//   {
//     heading: 'Marketplace',
//     links: [
//       { label: 'Browse Listings', href: '/buyer' },
//       { label: 'Browse by Brand', href: '/brands' },
//       { label: 'Explore Shops', href: '/shops' },
//       { label: 'Post an Ad', href: '/seller' },
//     ],
//   },
//   {
//     heading: 'Sellers',
//     links: [
//       { label: 'Become a Seller', href: '/become-seller' },
//       { label: 'My Shop', href: '/my-shop' },
//       { label: 'Manage Listings', href: '/my-ads' },
//       { label: 'Seller Verification', href: '/seller-verification' },
//     ],
//   },
//   {
//     heading: 'Support',
//     links: [
//       { label: 'Blogs', href: '/blogs' },
//       { label: 'Contact Us', href: '/contact' },
//     ],
//   },
//   {
//     heading: 'Legal',
//     links: [
//       { label: 'Privacy Policy', href: '/privacy-policy' },
//       { label: 'Terms of Service', href: '/terms-and-conditions' },
//     ],
//   },
// ];

// export default function Footer() {
//   return (
//     <footer className="hidden md:block bg-[#0e1a1f] text-slate-400" id="contact">

//       {/* ── Main grid ── */}
//       <div className="mx-auto max-w-7xl px-6 pb-14 pt-16 lg:px-8">
//         <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.8fr_repeat(4,1fr)]">

//           {/* Brand column */}
//           <div className="flex flex-col gap-5">
//             <Link href="/" className="inline-flex items-center gap-2.5">
//               <Image src="/favicon.png" alt="Sanatkar" width={36} height={36} className="h-9 w-9 object-contain" />
//               <span className="text-xl font-extrabold tracking-tight text-white">
//                 Sanat<span className="text-[#13bdc4]">kar</span>
//               </span>
//             </Link>

//             <p className="text-sm leading-relaxed text-slate-400">
//               Pakistan&apos;s industrial marketplace for machinery, parts, and vehicles — connecting buyers and sellers across the country.
//             </p>

//             <a
//               href="mailto:support@sanatkar.com"
//               className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-[#13bdc4]"
//             >
//               <Mail size={15} />
//               support@sanatkar.com
//             </a>
//           </div>

//           {/* Link columns */}
//           {columns.map((col) => (
//             <div key={col.heading}>
//               <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
//                 {col.heading}
//               </h4>
//               <ul className="flex flex-col gap-3">
//                 {col.links.map((link) => (
//                   <li key={link.label}>
//                     <Link
//                       href={link.href}
//                       className="text-sm text-slate-400 transition-colors hover:text-white"
//                     >
//                       {link.label}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── Bottom bar ── */}
//       <div className="border-t border-white/10">
//         <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-xs text-slate-500 sm:flex-row lg:px-8">
//           <p>© 2026 SanatKar Marketplace. All rights reserved.</p>

//           <a
//             href="https://broshtech.com"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="transition-colors hover:text-slate-300"
//           >
//             Designed &amp; Developed by{' '}
//             <span className="font-semibold text-[#13bdc4]">BroshTech</span>
//           </a>

//           <nav aria-label="Social media" className="flex items-center gap-5">
//             <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Instagram</a>
//             <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Facebook</a>
//             <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">TikTok</a>
//           </nav>
//         </div>
//       </div>

//     </footer>
//   );
// }








'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';

const BROSH_TECH_LOGO =
  'https://cdn.shopify.com/s/files/1/1122/0300/6290/files/html-logo.webp?v=1793360577';

const columns = [
  {
    heading: 'Marketplace',
    links: [
      { label: 'Browse Listings', href: '/buyer' },
      { label: 'Browse by Brand', href: '/brands' },
      { label: 'Explore Shops', href: '/shops' },
      { label: 'Post an Ad', href: '/seller' },
    ],
  },
  {
    heading: 'Sellers',
    links: [
      { label: 'Become a Seller', href: '/become-seller' },
      { label: 'My Shop', href: '/my-shop' },
      { label: 'Manage Listings', href: '/my-ads' },
      { label: 'Seller Verification', href: '/seller-verification' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Blogs', href: '/blogs' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-and-conditions' },
    ],
  },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="hidden md:block bg-[#0e1a1f] text-slate-400" id="contact">
      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_repeat(4,1fr)] lg:gap-10">
          {/* Brand column */}
          <div className="flex max-w-xs flex-col gap-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/favicon.png"
                alt="Sanatkar"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                Sanat<span className="text-[#13bdc4]">kar</span>
              </span>
            </Link>

            <p className="text-sm leading-[1.75] text-slate-400">
              Pakistan&apos;s industrial marketplace for machinery, parts, and
              vehicles — connecting buyers and sellers across the country.
            </p>

            <a
              href="mailto:support@sanatkar.com"
              className="mt-1 inline-block text-sm text-slate-300 transition-colors hover:text-[#13bdc4]"
            >
              support@sanatkar.com
            </a>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                {col.heading}
              </h4>
              <span className="mt-2.5 mb-6 block h-[2px] w-6 rounded-full bg-[#13bdc4]" />

              <ul className="flex flex-col gap-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <p>© 2026 SanatKar Marketplace</p>
            <span className="text-white/20" aria-hidden="true">
              |
            </span>
            <a
              href="https://broshtech.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="BroshTech"
              className="inline-flex items-center opacity-85 transition-opacity hover:opacity-100"
            >
              <Image
                src={BROSH_TECH_LOGO}
                alt="BroshTech"
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 rounded-sm object-contain"
              />
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-[#13bdc4] hover:text-white"
          >
            <span>back to top</span>
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}