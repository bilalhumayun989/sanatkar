import { NextResponse } from 'next/server';

export async function PATCH() {
    return NextResponse.json({ success: false, message: 'Category updates are disabled' }, { status: 400 });
}
