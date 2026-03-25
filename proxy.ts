import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
    const authCookie = request.cookies.get('auth_token')?.value;

    const { pathname } = request.nextUrl;

    // Define protected routes that require login
    const protectedPaths = ['/seller', '/buyer/dashboard', '/messages'];

    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (isProtected) {
        if (!authCookie) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const payload = await verifyToken(authCookie);
        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

    }

    // Only allow admins into /admin paths
    if (pathname.startsWith('/admin') && !pathname.includes('/login')) {
        // Here you could restrict admin area based on jwt role OR use existing adminAuth for demo purposes
        // Since we are moving to proper auth, let's enforce role=admin
        if (!authCookie) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        const payload = await verifyToken(authCookie);
        if (!payload || payload.role !== 'admin') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // If user is logged in, redirect away from /login or /signup
    if ((pathname === '/login' || pathname === '/signup') && authCookie) {
        const payload = await verifyToken(authCookie);
        if (payload) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
