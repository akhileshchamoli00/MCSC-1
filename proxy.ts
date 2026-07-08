import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const deadPatterns: string[] = [
    '/en/product/',
    '/pengurusan-perizinan-badan-usaha',
]

export function proxy(request: NextRequest) {
    const hostname = request.headers.get('host') || ''
    const path = request.nextUrl.pathname

    if (hostname.startsWith('development.')) {
        const response = NextResponse.next()
        response.headers.set('X-Robots-Tag', 'noindex, nofollow')
        return response
    }

    // Redirect non-www to www
    if (hostname === 'mcsc.co.id') {
        const url = request.nextUrl.clone()
        url.hostname = 'www.mcsc.co.id'
        return NextResponse.redirect(url, 301)
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