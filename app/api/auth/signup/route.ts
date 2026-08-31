import { createServerClient } from '@/lib/auth/supabase/ssr';
import { createAdminClient } from '@/lib/auth/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  const { email, password, username, phone, accountType, fullName, cnic } = await request.json();
  
  // Validation
  if (!email || !password || !username || !phone) {
    return NextResponse.json({ success: false, message: 'Username, email, password, and phone number are required.' }, { status: 400 });
  }
  
  if (accountType === 'seller') {
    if (!fullName) return NextResponse.json({ success: false, message: 'Professional seller accounts require full name.' }, { status: 400 });
    if (!cnic) return NextResponse.json({ success: false, message: 'Professional seller accounts require CNIC number.' }, { status: 400 });
  }
  
  const response = NextResponse.json({ success: true, message: 'Check your email to confirm your account.' }, { status: 201 });
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
  });

  // Include role and additional data in user metadata so trigger can use it
  const userMetadata = {
    username,
    account_type: accountType === 'seller' ? 'seller' : 'regular',
    phone,
    full_name: accountType === 'seller' ? fullName : null,
    cnic: accountType === 'seller' ? cnic : null
  };

  const redirectUrl = `${new URL(request.url).origin}/auth/callback?type=signup&next=/login`;
  console.log('Signup attempt:', { email, accountType, userMetadata, redirectUrl });

  const { data, error } = await client.auth.signUp({ 
    email, 
    password, 
    options: { 
      data: userMetadata,
      emailRedirectTo: redirectUrl
    } 
  });
  
  console.log('Supabase signup result:', { 
    userId: data?.user?.id, 
    email: data?.user?.email,
    emailConfirmedAt: data?.user?.email_confirmed_at,
    error: error?.message 
  });
  
  if (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  // Check if user was created but needs email confirmation
  if (data?.user && !data?.user?.email_confirmed_at) {
    console.log('User created successfully, waiting for email confirmation');
    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully! Please check your email (including spam folder) to confirm your account.',
      userId: data.user.id
    }, { status: 201 });
  }
  
  // The trigger will now handle the role assignment properly using the metadata
  // No need for additional updates since everything is handled in the trigger
  
  return response;
}
