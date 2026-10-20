import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 6;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function isSafeUpload(file: File) {
  const mime = file.type || '';
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const mimeByExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return extension in mimeByExtension
    && ALLOWED_MIME_TYPES.has(mime)
    && mimeByExtension[extension] === mime
    && file.size > 0
    && file.size <= MAX_FILE_SIZE;
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentUser(req);
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const folderValue = formData.get('folder');
    if (folderValue !== null && !['blogs', 'shops', 'categories', 'brands'].includes(String(folderValue))) {
      return NextResponse.json({ success: false, message: 'Unsupported upload folder.' }, { status: 400 });
    }
    const folder = folderValue === 'blogs' || folderValue === 'shops' || folderValue === 'categories' || folderValue === 'brands' ? folderValue : null;
    if (folder) {
      const { profile } = await getCurrentProfile(req);
      if (!profile) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      if (folder !== 'shops' && profile.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
      }
    }

    const values = formData.getAll('files').length > 0 ? formData.getAll('files') : formData.getAll('file');
    if (values.some(value => !(value instanceof File))) {
      return NextResponse.json({ success: false, message: 'Invalid upload.' }, { status: 400 });
    }
    const files = values as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, message: 'No files uploaded.' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ success: false, message: `A maximum of ${MAX_FILES} images can be uploaded at once.` }, { status: 400 });
    }
    if (files.some(file => !isSafeUpload(file))) {
      return NextResponse.json({ success: false, message: 'Only matching JPG, PNG, GIF, or WEBP files under 5MB are allowed.' }, { status: 400 });
    }

    const uploadDir = folder
      ? join(process.cwd(), 'public', 'uploads', folder)
      : join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 80) || `upload-${Date.now()}`;
      const filename = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const filePath = join(uploadDir, filename);
      await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
      uploadedUrls.push(`/uploads/${folder ? `${folder}/` : ''}${filename}`);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls, message: 'Files uploaded successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
  }
}
