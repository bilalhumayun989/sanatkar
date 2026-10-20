import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { getCurrentProfile } from '@/lib/auth/supabase/server';

export async function GET(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  try {
    const profiles = await prisma.profile.findMany({
      select: { id: true, username: true, fullName: true, email: true, role: true, emailVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, users: profiles.map(item => ({
      id: item.id,
      name: item.fullName || item.username,
      email: item.email,
      role: item.role,
      isVerified: item.emailVerified,
      createdAt: item.createdAt,
    })) });
  } catch (error) {
    console.error('Admin profiles query failed:', error);
    return NextResponse.json({ message: 'Unable to load users.' }, { status: 500 });
  }
}

// Auth users are managed by Supabase Auth and are never deleted through this API.
export async function DELETE(request: NextRequest) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') return NextResponse.json({ message: 'Admin access required.' }, { status: 403 });
  return NextResponse.json({ message: 'Supabase Auth users cannot be deleted from the application dashboard.' }, { status: 405 });
}
