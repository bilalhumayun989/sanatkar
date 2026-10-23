import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { createAdminClient, createClient, getCurrentUser } from '@/lib/auth/supabase/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth/supabase/auth-cookie';
import { deleteAccount, IdentityDeletionError } from '@/lib/auth/delete-account';
import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  // Native apps send bearer auth without Origin. Browser requests must be same-origin.
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ success: false, message: 'Invalid request origin.' }, { status: 403 });
  }
  const { user } = await getCurrentUser(request);
  if (!user) return NextResponse.json({ success: false, message: 'Please sign in again.' }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  const password = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>).password : null;
  if (typeof password !== 'string' || !password.trim() || password.length > 1024) {
    return NextResponse.json({ success: false, message: 'Enter your current password.' }, { status: 400 });
  }
  if (!user.email) return NextResponse.json({ success: false, message: 'An email and password are required to delete your account.' }, { status: 400 });

  try {
    // Construct this before modifying anything: missing server credentials fail safely.
    const admin = createAdminClient();
    const [{ attempts }] = await prisma.$queryRaw<Array<{ attempts: number }>>`
      INSERT INTO public.account_deletion_attempts(user_id) VALUES (${user.id}::uuid)
      ON CONFLICT (user_id) DO UPDATE SET
        attempts = CASE WHEN account_deletion_attempts.window_started_at < now() - interval '15 minutes' THEN 1 ELSE account_deletion_attempts.attempts + 1 END,
        window_started_at = CASE WHEN account_deletion_attempts.window_started_at < now() - interval '15 minutes' THEN now() ELSE account_deletion_attempts.window_started_at END
      RETURNING attempts`;
    if (attempts > 5) return NextResponse.json({ success: false, message: 'Too many attempts. Try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': '900' } });

    // Use an isolated client; never replace the user's browser/app session.
    // The email and deletion ID both come from the verified session, never the body.
    const verifier = createClient();
    const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password });
    if (error || data.user?.id !== user.id || !data.session) {
      if (data.session) await verifier.auth.signOut({ scope: 'local' }).catch(() => {});
      return NextResponse.json({ success: false, message: 'Incorrect password. If you use Google, set a password first using the password reset link.' }, { status: 403 });
    }
    try {
      await deleteAccount(prisma, user.id, async () => {
        const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
        if (deletionError) throw deletionError;
      });
    } finally {
      // Reauthentication creates a temporary session; do not leave it active on failure.
      await verifier.auth.signOut({ scope: 'local' }).catch(() => {});
    }
    // Remove only this identity's generated private payment screenshots.
    const proofDirectory = join(process.cwd(), 'private', 'seller-payments');
    const names = await readdir(proofDirectory).catch(() => [] as string[]);
    await Promise.all(names.filter(name => name.startsWith(`${user.id}-`) && /^[0-9a-f-]{36}-[0-9a-f-]{36}\.(png|jpg|webp)$/i.test(name))
      .map(name => unlink(join(proofDirectory, name)).catch(() => {})));
    const response = NextResponse.json({ success: true, message: 'Your account has been permanently deleted.' });
    response.cookies.set(AUTH_COOKIE_NAME, '', { ...authCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    // Never log request bodies, passwords, tokens, or provider error payloads.
    console.error('Account deletion failed', { userId: user.id, stage: error instanceof IdentityDeletionError ? 'identity' : 'database' });
    return NextResponse.json({ success: false, message: 'Unable to complete account deletion. Please try again or contact support.' }, { status: 503 });
  }
}
