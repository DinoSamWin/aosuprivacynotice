
import { NextRequest, NextResponse } from 'next/server';
import { deleteFolder } from '@/lib/store';
import { getSession } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await deleteFolder(id);
    return NextResponse.json({ success: true });
}
