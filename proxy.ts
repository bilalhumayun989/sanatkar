import { NextResponse, type NextRequest } from 'next/server';

// Authentication is checked in API handlers and database row-level policies.
// The browser refreshes the session; the proxy does not rotate refresh tokens.
export default function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.png).*)'] };
