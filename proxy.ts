import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Do not crash every public page before a developer has configured Supabase.
  // Auth API routes perform a checked setup error when used.
  if (!isSupabaseConfigured()) return response;
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const protectedPath = ['/seller', '/buyer/dashboard', '/messages'].some((path) => pathname.startsWith(path));
  if (protectedPath && !user) return NextResponse.redirect(new URL('/login', request.url));
  if ((pathname === '/login' || pathname === '/signup') && user) return NextResponse.redirect(new URL('/', request.url));
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url));
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/', request.url));
  }
  return response;
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] };
