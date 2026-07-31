import { createServerClient } from '@/lib/supabase/ssr';
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { email, password, username, phone, additionalPhone, accountType } = await request.json();
  if (!email || !password || !username || !phone) return NextResponse.json({ success: false, message: 'Username, email, password, and phone number are required.' }, { status: 400 });
  if (accountType === 'seller' && !additionalPhone) return NextResponse.json({ success: false, message: 'Seller accounts require an additional phone number.' }, { status: 400 });
  const response = NextResponse.json({ success: true, message: 'Check your email to confirm your account.' }, { status: 201 });
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) },
  });
  const { data, error } = await client.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: `${new URL(request.url).origin}/login` } });
  if (error) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  if (data.user) await createAdminClient().from('profiles').update({ phone, additional_phone: accountType === 'seller' ? additionalPhone : null, role: accountType === 'seller' ? 'seller' : 'user' }).eq('id', data.user.id);
  return response;
}
