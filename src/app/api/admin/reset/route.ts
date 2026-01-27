
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveStore } from '@/lib/store';
import { DataStore } from '@/lib/types';

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (session?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset store to empty
    const emptyStore: DataStore = {
        folders: [],
        files: []
    };

    try {
        await saveStore(emptyStore);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset failed:', error);
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
    }
}
