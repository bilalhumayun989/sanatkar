import { NextResponse } from 'next/server';
import { FIXED_CATEGORY_OPTIONS } from '@/lib/categoryConstants';

export async function GET() {
    try {
        const categories = FIXED_CATEGORY_OPTIONS.map((option) => ({
            id: option.value,
            name: option.label,
            slug: option.value,
            isPopular: true,
        }));
        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json({ success: false, message: 'Custom categories are disabled' }, { status: 400 });
}
