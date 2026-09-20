import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths only the ADMIN role may open. This is a UX-level gate only — the
// backend independently enforces the same restriction on every API call,
// so bypassing this (or this middleware misbehaving) can't expose data.
const ADMIN_ONLY_PREFIXES = ['/admin/crm/invoices', '/admin/crm/users', '/admin/crm/completed']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('pruview_token')?.value
  const role  = request.cookies.get('pruview_role')?.value

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

  // Logged in but role lacks access to an Admin-only section
  if (token && role && role !== 'ADMIN' && ADMIN_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/admin/crm', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*']
}