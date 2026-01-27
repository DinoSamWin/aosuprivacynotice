
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
export const GUEST_PASSWORD = process.env.GUEST_PASSWORD || 'guest123';

export const COOKIE_NAME = 'auth_session';

import { cookies } from 'next/headers';

export async function getSession(): Promise<{ role: 'admin' | 'guest' } | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME);

    if (!session) return null;

    if (session.value === ADMIN_PASSWORD) return { role: 'admin' };
    if (session.value === GUEST_PASSWORD) return { role: 'guest' };

    return null;
}
