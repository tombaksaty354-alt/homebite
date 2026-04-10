import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials belum diisi di environment variables!');
}

// Create Supabase client with service role key (server-side only)
export function createServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('Service role key not configured');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Create Supabase client with anon key (for client-authenticated requests)
export function createAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Extract and validate user session from request
export async function getUserFromRequest(request: Request) {
  try {
    const supabase = createAnonClient();
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Authentication failed' };
  }
}

// Get user profile from database
export async function getUserProfile(userId: string) {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { user: null, error: 'User profile not found' };
    }

    return { user: data, error: null };
  } catch (error: any) {
    return { user: null, error: error.message || 'Failed to fetch user profile' };
  }
}

// Require authentication
export async function requireAuth(request: Request) {
  const { user: authUser, error } = await getUserFromRequest(request);
  
  if (error || !authUser) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Unauthorized - Please login' },
        { status: 401 }
      ),
      user: null
    };
  }

  const { user: profile } = await getUserProfile(authUser.id);
  
  if (!profile) {
    return {
      response: NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      ),
      user: null
    };
  }

  return { response: null, user: profile };
}

// Require specific role
export async function requireRole(request: Request, allowedRoles: string[]) {
  const auth = await requireAuth(request);
  
  if (auth.response) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      response: NextResponse.json(
        { success: false, error: `Forbidden - Required role: ${allowedRoles.join(' or ')}` },
        { status: 403 }
      ),
      user: null
    };
  }

  return auth;
}

// Require admin role
export async function requireAdmin(request: Request) {
  return requireRole(request, ['admin']);
}

// Require mitra or admin role
export async function requireMitraOrAdmin(request: Request) {
  return requireRole(request, ['mitra', 'admin']);
}
