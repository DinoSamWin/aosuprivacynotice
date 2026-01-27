
import { NextRequest, NextResponse } from 'next/server';
import { getFolders, createFolder, updateFolderOrder } from '@/lib/store';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId') || null;
    const folders = await getFolders(parentId === 'null' ? null : parentId);
    return NextResponse.json(folders);
}

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const folder = await createFolder(name, parentId === 'null' ? null : parentId);
    return NextResponse.json(folder);
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

    await updateFolderOrder(items);
    return NextResponse.json({ success: true });
}
