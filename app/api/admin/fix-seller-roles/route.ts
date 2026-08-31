import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ 
        success: false, 
        message: 'userIds array is required' 
      }, { status: 400 });
    }

    const admin = createAdminClient();
    
    // Update roles to seller for specified user IDs
    const { data, error } = await admin
      .from('profiles')
      .update({ role: 'seller' })
      .in('id', userIds);

    if (error) {
      console.error('Error updating roles:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update roles', 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated ${userIds.length} user(s) to seller role`,
      updatedUsers: userIds
    });

  } catch (error: any) {
    console.error('Fix seller roles error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, { status: 500 });
  }
}

// Get all users who should be sellers but aren't
export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Get all users with regular role who have full_name and cnic (indicating they should be sellers)
    const { data: users, error } = await admin
      .from('profiles')
      .select('id, username, email, role, full_name, cnic')
      .eq('role', 'regular')
      .not('full_name', 'is', null)
      .not('cnic', 'is', null);

    if (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch users', 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      usersNeedingUpdate: users || [],
      count: users?.length || 0
    });

  } catch (error: any) {
    console.error('Get users needing update error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    }, { status: 500 });
  }
}