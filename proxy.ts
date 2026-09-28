import { createServerClient, isSupabaseConfigured } from '@/lib/auth/supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // Supabase is experiencing latency issues according to status.supabase.com
  // Temporarily disable middleware to prevent timeout loops until Supabase fixes the issue
  console.log('Middleware bypassed due to Supabase latency issues for:', request.nextUrl.pathname);
  
  // For now, only protect critical admin routes without Supabase calls
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/admin')) {
    // For admin routes, redirect to login but don't check Supabase
    // This is a basic protection until Supabase is stable
    return NextResponse.redirect(new URL('/login?admin=1', request.url));
  }
  
  return NextResponse.next({ request });
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.png).*)'] };
