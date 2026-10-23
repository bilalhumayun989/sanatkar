import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (!email) return NextResponse.json({ message: 'Enter your email address.' }, { status: 400 });

  const redirectTo = new URL('/auth/callback?type=recovery&next=%2Freset-password', request.url).toString();
  const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) {
    console.error('Password recovery request failed:', error.message);
    return NextResponse.json({ message: 'Unable to request a reset email right now. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ message: 'If an account exists for that email, a password reset link will arrive shortly. Check your spam folder too.' });
}
