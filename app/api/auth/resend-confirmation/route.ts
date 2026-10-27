import { createClient } from '@/lib/auth/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ success: false, message: 'Enter your email address.' }, { status: 400 });

  const appOrigin = new URL(request.url).origin;
  const emailRedirectTo = new URL('/auth/callback?next=%2F', appOrigin).toString();
  const { error } = await createClient().auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    console.error('Supabase confirmation resend failed:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: 'If this account is waiting for confirmation, Supabase has sent a new confirmation link. Open the latest email to verify it.',
  });
}
