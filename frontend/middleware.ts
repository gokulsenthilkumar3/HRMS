import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/careers'];

// Routes restricted to admin-only (ADMIN role)
const ADMIN_ONLY_PATHS = ['/settings'];

// Routes restricted to admin or manager
const MANAGER_PATHS = ['/reports', '/compliance'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Allow public paths without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow root landing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Read auth token — use hrms_token cookie (set by AuthContext on login)
  const token = request.cookies.get('hrms_token')?.value;
  const roleRaw = request.cookies.get('hrms_role')?.value ?? '';
  const role = roleRaw.toUpperCase();

  // Redirect unauthenticated users to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Enforce admin-only routes
  if (ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Enforce manager+ routes
  if (MANAGER_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
