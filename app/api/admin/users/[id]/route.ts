import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/dbConn';
import { createAdminClient, getCurrentProfile } from '@/lib/auth/supabase/server';
import { deleteAccountData } from '@/lib/auth/delete-account';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(request: NextRequest, { params }: Context) {
  const { user, profile } = await getCurrentProfile(request);
  if (!user || profile?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  }

  const { id: targetId } = await params;

  if (!uuidPattern.test(targetId)) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  // Prevent an admin from deleting their own account through this endpoint.
  if (targetId === user.id) {
    return NextResponse.json({ success: false, message: 'You cannot delete your own account from the admin panel.' }, { status: 400 });
  }

  // Confirm the target profile exists before proceeding.
  const target = await prisma.profile.findUnique({ where: { id: targetId }, select: { id: true, role: true } });
  if (!target) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  // Prevent deleting another admin account.
  if (target.role === 'admin') {
    return NextResponse.json({ success: false, message: 'Admin accounts cannot be deleted through this panel.' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    // Check whether this user has a real Supabase Auth identity.
    // Dummy/seeded profiles that were inserted directly into the DB won't have one.
    const { data: authUser } = await admin.auth.admin.getUserById(targetId);
    const hasAuthIdentity = Boolean(authUser?.user);

    let identityRemoved = !hasAuthIdentity; // skip auth deletion if no identity exists
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          await deleteAccountData(tx, targetId);
          if (!identityRemoved) {
            const { error } = await admin.auth.admin.deleteUser(targetId);
            // Treat "user not found" in Auth as success — profile data is what matters.
            if (error && !error.message?.toLowerCase().includes('not found')) throw error;
            identityRemoved = true;
          }
        }, { timeout: 20000, maxWait: 5000 });
        break;
      } catch (error) {
        if (!identityRemoved || attempt === 2) throw error;
      }
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin user deletion failed', { adminId: user.id, targetId });
    return NextResponse.json({ success: false, message: 'Unable to delete user. Please try again.' }, { status: 500 });
  }
}
