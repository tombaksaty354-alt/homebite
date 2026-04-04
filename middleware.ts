import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/mitra', // Mitra registration form
  '/produk', // Public product listing
  '/api/produk', // Public API
];

// Routes that require specific roles
const protectedRoutes = {
  '/admin': 'admin',
  '/mitra-dashboard': 'mitra',
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Get session from cookie
  const session = request.cookies.get('sb-access-token');
  
  // If no session and trying to access protected route
  if (!session && !isPublicRoute && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin/mitra routes, we'll do role check client-side for now
  // (Full server-side role check requires JWT decoding)
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) => 
    pathname.startsWith(route)
  );

  if (protectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/mitra-dashboard/:path*',
    '/pesanan/:path*',
    '/keranjang/:path*',
    '/checkout/:path*',
    '/chat/:path*',
    '/profil/:path*',
    '/alamat/:path*',
    '/customer-rekening/:path*',
    '/dashboard/:path*',
  ],
};
