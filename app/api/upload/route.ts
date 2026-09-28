import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ message: 'No files uploaded' }, { status: 400 });
        }

        const uploadDir = join(process.cwd(), 'public', 'images');
        
        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (err) {
            // Ignore if exists
        }

        const uploadedUrls: string[] = [];

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const fileExtension = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExtension}`;
            const path = join(uploadDir, fileName);

            await writeFile(path, buffer);
            uploadedUrls.push(`/images/${fileName}`);
        }

        return NextResponse.json({ 
            message: 'Files uploaded successfully', 
            urls: uploadedUrls 
        }, { status: 200 });
        
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ message: error.message || 'Upload failed' }, { status: 500 });
    }
}
