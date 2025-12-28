import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname
    const isPublicPath = path === '/login' || path === '/register' || path === '/'

    const token = request.cookies.get('token')?.value

    if (path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/static')) {
        return NextResponse.next()
    }

    // Admin Authentication Flow
    if (path.startsWith('/admin')) {
        // Allow access to the login page itself
        if (path === '/admin/login') {
            if (token) return NextResponse.redirect(new URL('/admin', request.nextUrl));
            return NextResponse.next();
        }

        // Protect all other admin routes
        if (!token) {
            return NextResponse.redirect(new URL('/admin/login', request.nextUrl));
        }
    }

    // Standard User Authentication Flow (for root, dashboard, etc)
    if (isPublicPath && token) {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
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
