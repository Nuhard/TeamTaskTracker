import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const isPublicPath = path === '/login' || path === '/register' || path === '/'

    const token = request.cookies.get('token')?.value

    let userRole = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.role;
        } catch (e) {
            console.error("Middleware decode error", e);
        }
    }

    if (path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/static')) {
        return NextResponse.next()
    }

    // Role-based Redirection
    if (token) {
        if (userRole === 'ADMIN' && path.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/admin', request.nextUrl))
        }
        if (userRole === 'USER' && path.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
        }
    }

    // Admin Authentication Flow
    if (path.startsWith('/admin')) {
        if (path === '/admin/login') {
            if (token && userRole === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.nextUrl));
            return NextResponse.next();
        }

        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.nextUrl));
        }
    }

    // Standard User Authentication Flow
    if (isPublicPath && token) {
        return NextResponse.redirect(new URL(userRole === 'ADMIN' ? '/admin' : '/dashboard', request.nextUrl))
    }

    if (!isPublicPath && !token && !path.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.nextUrl))
    }
}

export const config = {
    matcher: [
        '/',
        '/login',
        '/register',
        '/dashboard/:path*',
        '/admin/:path*'
    ]
}
