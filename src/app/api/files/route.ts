
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

    // Calculate order in store.ts addFile, but better to be explicit or let store handle it.
    // store.addFile handles logic now.

    const fileRecord: any = { // Temporary any to bypass type check before order is assigned by store? 
        // No, store.addFile expects FileStr. But I just added order to FileStr.
        // So I need to provide order here or make it optional in type?
        // I made it required in type. So I should provide it or update type to optional?
        // User wants persistent order.
        // Let's check store.ts again. I modified addFile to calculate order.
        // But typescript might complain if I pass an object without order to a function expecting FileStr.
        // I'll set order: -1 initially and let store update it, OR update store.addFile to take Omit<FileStr, 'order'>.
        // Simpler: Set order: 0 here, store overwrites it.
        id: uuidv4(),
        name: filename,
        folderId,
        remark: remark || '',
        path: fileUrl,
        uploadDate: new Date().toISOString(),
        order: 0 // Placeholder, will be updated by addFile logic
    };

    await addFile(fileRecord);
    // Fetch the file back to get the correct order? 
    // allow addFile to mutate or return the file?
    // In store.ts: file.order = maxOrder + 1; store.files.push(file);
    // Since objects are passed by reference, fileRecord.order will be updated.

    return NextResponse.json(fileRecord);
}

export async function PUT(request: NextRequest) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // Array of { id, order }

    if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Dynamic import to avoid circular dependency if any? No.
    const { updateFileOrder } = await import('@/lib/store');
    await updateFileOrder(items);
    return NextResponse.json({ success: true });
}
