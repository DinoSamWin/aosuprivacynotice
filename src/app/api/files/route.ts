
import { NextRequest, NextResponse } from 'next/server';
import { getStore, addFile } from '@/lib/store';
import { getSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get('folderId');

    if (!folderId) {
        return NextResponse.json({ error: 'folderId is required' }, { status: 400 });
    }

    const store = await getStore();
    const files = store.files.filter(f => f.folderId === folderId);
    return NextResponse.json(files);
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folderId') as string;
    const remark = formData.get('remark') as string;

    if (!file || !folderId) {
        return NextResponse.json({ error: 'File and folderId are required' }, { status: 400 });
    }

    const filename = file.name;
    let fileUrl = '';

    // Hybrid Storage Logic
    try {
        if (process.env.BLOB_READ_WRITE_TOKEN) {
            // Vercel Blob
            const blob = await put(filename, file, { access: 'public' });
            fileUrl = blob.url;
        } else {
            // Local File System
            const buffer = Buffer.from(await file.arrayBuffer());
            const safeFilename = `${uuidv4()}-${filename}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            const filePath = path.join(uploadDir, safeFilename);

            await writeFile(filePath, buffer);
            fileUrl = `/uploads/${safeFilename}`;
        }
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed: ' + (error as Error).message }, { status: 500 });
    }

    const fileRecord = {
        id: uuidv4(),
        name: filename,
        folderId,
        remark: remark || '',
        path: fileUrl,
        uploadDate: new Date().toISOString()
    };

    await addFile(fileRecord);
    return NextResponse.json(fileRecord);
}
