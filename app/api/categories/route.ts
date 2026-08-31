import { NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase/server';

export async function GET() {
    try {
        const supabase = createClient();
        
        // Fetch categories from database
        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, name, icon_code, description, is_active')
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        // Map to expected format
        const mappedCategories = (categories || []).map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.name.toLowerCase().replace(/\s+/g, '-'),
            icon_code: category.icon_code,
            description: category.description,
            is_active: category.is_active,
        }));

        return NextResponse.json({ 
            success: true, 
            categories: mappedCategories,
            count: mappedCategories.length 
        });
    } catch (error: any) {
        console.error('Categories API error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to fetch categories',
            categories: []
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const body = await request.json();
        
        const { name, icon_code, description } = body;
        
        if (!name?.trim()) {
            return NextResponse.json({ 
                success: false, 
                message: 'Category name is required' 
            }, { status: 400 });
        }

        const { data: category, error } = await supabase
            .from('categories')
            .insert([
                {
                    name: name.trim(),
                    icon_code: icon_code || 58345,
                    description: description?.trim() || '',
                    is_active: true
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Database insert error:', error);
            throw error;
        }

        return NextResponse.json({ 
            success: true, 
            category: {
                id: category.id,
                name: category.name,
                slug: category.name.toLowerCase().replace(/\s+/g, '-'),
                icon_code: category.icon_code,
                description: category.description,
                is_active: category.is_active,
            }
        });
    } catch (error: any) {
        console.error('Categories POST error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Failed to create category'
        }, { status: 500 });
    }
}
