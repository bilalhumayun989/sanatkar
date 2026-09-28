import { NextResponse } from 'next/server';
export async function GET() { return NextResponse.json({ message: 'Email confirmation is handled by Supabase Auth.' }, { status: 410 }); }
