import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Define domains
    const mainDomain = 'frogroyale.fun'
    const whitelistDomain = 'whitelist.frogroyale.fun'

    // Local development support (optional)
    const isLocal = hostname.includes('localhost')

    // If the host is the main domain (or local for testing), rewrite to /coming-soon
    // We only rewrite the root path.
    if (hostname === mainDomain && url.pathname === '/') {
        return NextResponse.rewrite(new URL('/coming-soon', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/'],
}
