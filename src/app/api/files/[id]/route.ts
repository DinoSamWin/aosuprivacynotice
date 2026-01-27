
import { NextRequest, NextResponse } from 'next/server';
import { getStore, deleteFile } from '@/lib/store';
import { getSession } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';
import { del } from '@vercel/blob';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const store = await getStore();
    const file = store.files.find(f => f.id === id);

    if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Attempt to delete physical file or blob
    try {
        if (file.path.startsWith('http')) {
            // It's a URL, likely Blob
            if (process.env.BLOB_READ_WRITE_TOKEN) {
                await del(file.path);
            }
        } else {
            // It's a local path
            const filePath = path.join(process.cwd(), 'public', file.path);
            await unlink(filePath);
        }
    } catch (error) {
        console.error('Failed to delete physical file:', error);
        // Proceed to delete from store anyway
    }

    await deleteFile(id);
    return NextResponse.json({ success: true });
}
