import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/mitra', // Mitra registration form
  '/produk', // Public product listing
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

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

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

  // Create Supabase client for server-side auth check
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  // Get session from cookies (Supabase uses multiple cookies, we need to extract the auth token)
  // Supabase stores auth state in cookies, we'll use the API to verify
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  // If no session or auth error, redirect to login
  if (authError || !session?.user) {
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

    // Fetch user role from database (JWT doesn't contain role by default)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      // User profile not found, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role
    if (!allowedRoles.includes(userData.role)) {
      // Forbidden - user doesn't have required role
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

  // All checks passed
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
    '/wishlist/:path*',
    '/notifikasi/:path*',
    '/api/admin/:path*',
    '/api/mitra/:path*',
    '/api/orders/:path*',
  ],
};
