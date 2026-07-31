import { NextResponse } from 'next/server';
// Deliberately disabled: seeding/reset endpoints must never be publicly callable.
export async function GET() { return NextResponse.json({ message: 'Not found' }, { status: 404 }); }
export async function POST() { return NextResponse.json({ message: 'Not found' }, { status: 404 }); }
