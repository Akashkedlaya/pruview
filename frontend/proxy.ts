import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('pruview_token')?.value

  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginPage  = pathname === '/admin/login'

  // Not logged in + trying to access admin → redirect to login
  if (isAdminRoute && !isLoginPage && !token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Already logged in + visiting login page → redirect to dashboard
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
}