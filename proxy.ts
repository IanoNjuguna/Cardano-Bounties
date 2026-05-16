import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Routes that require authentication
const ProtectedRoutes = [
    '/api/submissions',
    '/api/admin',
    '/api/users'
]

// Routes that require admin role
const adminRoutes = [
    'api/admin'
]

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl

    // Check if route needs protection
    const isProtected = ProtectedRoutes.some(route => pathname.startsWith(route))
    const isAdmin = adminRoutes.some(route => pathname.startsWith(route))

    if (!isProtected) return NextResponse.next()
    
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.split(' ')[1] // "Bearer <token>"

    if (!token) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string
            address: string
            role: string
        }

        // Check admin access
        if (isAdmin && decoded.role !== 'admin') {
            return NextResponse.json({error: 'Forbidden'}, { status: 403 })
        }

        // Pass user info to the route via headers
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('x-user-id', decoded.userId)
        requestHeaders.set('x-user-role', decoded.role)
        requestHeaders.set('x-user-address', decoded.address)

        return NextResponse.next({ request: { headers: requestHeaders }})
    } catch {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }
}

export const config = {
    matcher: '/api/:path*'
}