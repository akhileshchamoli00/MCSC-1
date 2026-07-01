import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const deadPatterns = ['/en/product/', '/en/blog/', '/en/sbu-standar-badan-usaha-sijuk', '/en/contact']

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const path = request.nextUrl.pathname

    if (hostname.startsWith('development.')) {
        const response = NextResponse.next()
        response.headers.set('X-Robots-Tag', 'noindex, nofollow')
        return response
    }

    if (deadPatterns.some((p) => path.startsWith(p))) {
        return new NextResponse('Gone', { status: 410 })
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}