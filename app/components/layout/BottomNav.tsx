'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Plus, MessageCircle, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Ads', href: '/my-listings', icon: Briefcase },
    { label: 'SELL NOW', href: '/sell', isCta: true, icon: Plus },
    { label: 'Chats', href: '/messages', icon: MessageCircle },
    { label: 'Profile', href: '/mobile-profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full z-[9999] bg-white border-t border-slate-200  transform-gpu will-change-transform">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 py-1.5 flex items-center justify-between relative bg-white pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));

          if (item.isCta) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 sm:-mt-7 group shrink-0 px-2"
              >
                <div className="w-13 h-13 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0092b8] to-[#007a9b] hover:from-[#007a9b] hover:to-[#006080] text-white rounded-full flex items-center justify-center shadow-[#0092b8]/50 border-4 border-white transition-all duration-300 active:scale-95 group-hover:scale-110">
                  <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-[#0092b8] tracking-wider mt-1 uppercase whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-colors min-w-0 ${
                isActive ? 'text-[#0092b8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${isActive ? 'text-[#0092b8]' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="absolute top-full left-0 right-0 h-[200px] bg-white pointer-events-none" />
    </nav>
  );
}