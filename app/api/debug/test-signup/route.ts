import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/auth/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, testData } = await request.json();
    
    const admin = createAdminClient();
    
    // Test creating a user with specific metadata
    const testMetadata = {
      username: 'test_user',
      account_type: 'seller',
      phone: '03001234567',
      full_name: 'Test Seller Name', 
      cnic: '12345-1234567-1'
    };

    console.log('Testing signup with metadata:', testMetadata);

    const { data, error } = await admin.auth.admin.createUser({
      email: email || 'test@example.com',
      password: 'testpassword123',
      user_metadata: testMetadata,
      email_confirm: true
    });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 400 });
    }

    // Now check what was saved in profiles table
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user?.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        success: false,
        userCreated: true,
        profileError: profileError.message,
        userData: data.user
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      userData: {
        id: data.user?.id,
        email: data.user?.email,
        metadata: data.user?.user_metadata
      },
      profileData: profile
    });

  } catch (error: any) {
    console.error('Test signup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// Get profile data for debugging
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'userId required' 
      }, { status: 400 });
    }

    const admin = createAdminClient();
    
    // Get profile data
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get auth user data
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);

    return NextResponse.json({
      success: true,
      profile: profile,
      profileError: profileError?.message,
      authUser: {
        id: authUser.user?.id,
        email: authUser.user?.email,
        metadata: authUser.user?.user_metadata,
        emailConfirmed: authUser.user?.email_confirmed_at
      },
      authError: authError?.message
    });

  } catch (error: any) {
    console.error('Debug get error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}