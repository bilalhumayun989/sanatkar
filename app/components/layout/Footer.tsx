'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const columns = [
    {
      heading: t('footer_marketplace_heading'),
      links: [
        { label: t('footer_browse_listings'), href: '/buyer' },
        { label: t('footer_browse_brands'), href: '/brands' },
        { label: t('footer_explore_shops'), href: '/shops' },
        { label: t('footer_post_ad'), href: '/seller' },
      ],
    },
    {
      heading: t('footer_sellers_heading'),
      links: [
        { label: t('footer_become_seller'), href: '/become-seller' },
        { label: t('footer_my_shop'), href: '/my-shop' },
        { label: t('footer_manage_listings'), href: '/my-ads' },
        { label: t('footer_verification'), href: '/seller-verification' },
      ],
    },
    {
      heading: t('footer_support_heading'),
      links: [
        { label: t('footer_blogs'), href: '/blogs' },
        { label: t('footer_contact'), href: '/contact' },
      ],
    },
    {
      heading: t('footer_legal_heading'),
      links: [
        { label: t('footer_privacy'), href: '/privacy-policy' },
        { label: t('footer_terms'), href: '/terms-and-conditions' },
      ],
    },
  ];

  return (
    <footer className="hidden md:block bg-[#0e1a1f] text-slate-400" id="contact">

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_repeat(4,1fr)] lg:gap-10">

          {/* Brand column */}
          <div className="flex max-w-xs flex-col gap-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/favicon.png" alt="Sanatkar" width={36} height={36} className="h-9 w-9 object-contain" />
              <span className="text-xl tracking-tight text-white" style={{ fontWeight: 800, fontFamily: 'Arimo, sans-serif' }}>
                Sanat<span className="text-[#13bdc4]">kar</span>
              </span>
            </Link>
            <p className="text-sm leading-[1.75] text-slate-400">
              {t('footer_desc_urdu')}
            </p>
            <a href="mailto:support@sanatkar.com" className="mt-1 inline-block text-sm text-slate-300 transition-colors hover:text-[#13bdc4]">
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
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
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
          <p>{t('footer_rights')}</p>
          <a href="https://broshtech.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-300">
            {t('footer_designed_by')}{' '}
            <span className="font-semibold text-[#13bdc4]">BroshTech</span>
          </a>
          <nav aria-label="Social media" className="flex items-center gap-5">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Instagram</a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Facebook</a>
            <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">TikTok</a>
          </nav>
        </div>
      </div>

    </footer>
  );
}
