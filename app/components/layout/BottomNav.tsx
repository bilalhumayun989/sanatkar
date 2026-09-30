'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Briefcase, Plus, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/auth/supabase/client';

export default function BottomNav() {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  useEffect(() => {
    if (!authUser?.id) {
      setMessageUnreadCount(0);
      return;
    }

    let active = true;

    const fetchUnreadCount = async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false)
          .neq('sender_id', authUser.id);

        if (!active) return;
        if (!error) {
          setMessageUnreadCount(count ?? 0);
        }
      } catch {
        if (active) setMessageUnreadCount(0);
      }
    };

    fetchUnreadCount();

    return () => {
      active = false;
    };
  }, [authUser?.id]);

  const hiddenRoutePrefixes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/choose-account-type', '/auth'];
  const shouldHideBottomNav = hiddenRoutePrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Listings', href: '/my-listings', icon: Briefcase },
    { label: 'SELL NOW', href: '/sell', isCta: true, icon: Plus },
    { label: 'Chats', href: '/messages', icon: MessageCircle },
    { label: 'Profile', href: '/mobile-profile', icon: User },
  ];

  if (shouldHideBottomNav) {
    return null;
  }

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
                <div className="w-13 h-13 sm:w-16 sm:h-16 bg-[#09acc9] text-white rounded-full flex items-center justify-center shadow-[#0092b8]/50 border-4 border-white transition-all duration-300 active:scale-95 group-hover:scale-110">
                  <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-[#0092b8] tracking-wider mt-1 uppercase whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          }

          const showBadge = item.label === 'Chats' && messageUnreadCount > 0;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 transition-colors min-w-0 ${
                isActive ? 'text-[#0092b8]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {showBadge && (
                <span className="absolute -top-1 right-3 sm:right-5 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white leading-none">
                  {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                </span>
              )}
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