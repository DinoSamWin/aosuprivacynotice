
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, ADMIN_PASSWORD, GUEST_PASSWORD } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const session = request.cookies.get(COOKIE_NAME);
    const { pathname } = request.nextUrl;

    // Allow public assets and login page
    if (pathname.startsWith('/_next') ||
        pathname.startsWith('/uploads') ||
        pathname === '/login' ||
        pathname === '/gateway-demo' ||
        pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Protected routes check
    if (!session || (session.value !== ADMIN_PASSWORD && session.value !== GUEST_PASSWORD)) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
