import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  try {
    console.log('🔍 Checking for admin accounts...');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('⚠️ Supabase env vars not configured, assuming admin exists');
      return NextResponse.json({ hasAdmin: true, adminCount: 1 });
    }

    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : createClient(supabaseUrl, supabaseAnonKey);

    // Cek apakah ada user dengan role 'admin'
    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      console.error('❌ Error checking admin:', error);
      // Return false so setup can proceed
      return NextResponse.json({ hasAdmin: false, adminCount: 0 });
    }

    const hasAdmin = (count || 0) > 0;
    console.log('✅ Admin check result:', { hasAdmin, count });

    return NextResponse.json({
      hasAdmin,
      adminCount: count || 0
    });

  } catch (error: any) {
    console.error('❌ Check admin exception:', error);
    // Return false on error so setup can proceed
    return NextResponse.json({ hasAdmin: false, adminCount: 0 });
  }
}
