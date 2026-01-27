
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD, GUEST_PASSWORD, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { password } = body;

    if (password === ADMIN_PASSWORD || password === GUEST_PASSWORD) {
        const response = NextResponse.json({ success: true });
        // Set cookie
        response.cookies.set(COOKIE_NAME, password, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });
        return response;
    }

    return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
}
