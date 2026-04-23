import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/mitra', // Mitra registration form
  '/produk', // Public product listing
  '/tentang',
  '/faq',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
  '/api/produk', // Public API
  '/_next', // Next.js assets
  '/favicon.ico',
];

// Routes that require specific roles
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/mitra-dashboard': ['mitra'],
  '/api/admin': ['admin'],
  '/api/mitra': ['mitra'],
};

// Routes that require any authenticated user
const authenticatedRoutes = [
  '/pesanan',
  '/keranjang',
  '/checkout',
  '/chat',
  '/profil',
  '/alamat',
  '/customer-rekening',
  '/wishlist',
  '/notifikasi',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and public routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Allow homepage
  if (pathname === '/') {
    return NextResponse.next();
  }

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = authenticatedRoutes.some(route =>
    pathname.startsWith(route)
  ) || Object.keys(protectedRoutes).some(route =>
    pathname.startsWith(route)
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  // Create response to pass to Supabase SSR client (for cookie handling)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase SSR client that properly reads cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Update cookies on the response (for the browser)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verify the user's session using getUser() (secure, validates JWT with Supabase)
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user or auth error, redirect to login
  if (authError || !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access for protected routes
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const allowedRoles = protectedRoute[1];

    // Fetch user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role
    if (!allowedRoles.includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if mitra is approved
    if (userData.role === 'mitra' && userData.status === 'pending') {
      return NextResponse.json(
        { error: 'Account pending approval' },
        { status: 403 }
      );
    }
  }

  // All checks passed — return response with updated cookies
  return response;
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
    '/wishlist/:path*',
    '/notifikasi/:path*',
    '/api/admin/:path*',
    '/api/mitra/:path*',
    '/api/orders/:path*',
  ],
};
