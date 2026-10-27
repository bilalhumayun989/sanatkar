import { createServerClient } from '@/lib/auth/supabase/ssr';
import { createAdminClient } from '@/lib/auth/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient();
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find(user => user.email?.toLowerCase() === email);
    if (match) return { admin, user: match };
    if (data.users.length < 1000) return { admin, user: null };
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const { accountType, fullName, cnic } = body ?? {};

  if (!email || !password || !username || !phone) {
    return NextResponse.json({ success: false, message: 'Username, email, password, and phone number are required.' }, { status: 400 });
  }

  if (accountType === 'seller' && (!fullName || !cnic)) {
    return NextResponse.json({ success: false, message: 'Professional seller accounts require full name and CNIC number.' }, { status: 400 });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Account request accepted. Supabase will send a confirmation email if this address can be registered. Check your inbox and spam folder.',
  }, { status: 201 });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  // Preserve the origin being used now (localhost while developing, production
  // domain after deployment) instead of redirecting local email flows to Vercel.
  const appOrigin = new URL(request.url).origin;
  const redirectTo = new URL('/auth/callback?next=%2F', appOrigin).toString();
  const signup = () => supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        account_type: accountType === 'seller' ? 'seller' : 'regular',
        phone,
        full_name: accountType === 'seller' ? fullName : null,
        cnic: accountType === 'seller' ? cnic : null,
        onboarding_complete: false,
      },
      emailRedirectTo: redirectTo,
    },
  });

  let { data, error } = await signup();

  if (error) {
    console.error('Supabase signup request failed:', error.message);
    if (/already registered|already exists/i.test(error.message)) {
      return NextResponse.json({
        success: false,
        code: 'ACCOUNT_EXISTS',
        message: 'An account with this email already exists. Use a different email to create a new account, or log in and choose Forgot Password if you cannot access it.',
      }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  // Supabase intentionally obscures whether an existing email is confirmed in
  // signUp responses. Look it up with the server-only admin key so pending
  // signups can be replaced while verified accounts remain protected.
  if (data.user && data.user.identities?.length === 0) {
    try {
      const { admin, user } = await findAuthUserByEmail(email);
      if (!user) {
        return NextResponse.json({ success: false, message: 'Could not confirm the existing signup. Please try again.' }, { status: 503 });
      }
      if (user.email_confirmed_at) {
        return NextResponse.json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please log in or use Forgot Password.',
        }, { status: 409 });
      }

      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;

      ({ data, error } = await signup());
      if (error) throw error;
    } catch (replacementError) {
      console.error('Could not replace pending signup:', replacementError);
      return NextResponse.json({
        success: false,
        message: 'Could not restart the unverified signup. Please try again shortly.',
      }, { status: 503 });
    }
  }

  if (data.user) {
    console.info('Supabase accepted the signup request', {
      userId: data.user.id,
      confirmationRequired: !data.user.email_confirmed_at,
    });
  }

  return response;
}
