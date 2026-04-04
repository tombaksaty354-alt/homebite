import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Gunakan service key untuk cek admin (server-side only, aman)
const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    console.log('🔍 Checking for admin accounts...');
    
    // Cek apakah ada user dengan role 'admin'
    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    if (error) {
      console.error('❌ Error checking admin:', error);
      // Jika error, asumsikan sudah ada admin untuk keamanan
      return NextResponse.json({ hasAdmin: true, adminCount: 1, error: error.message });
    }

    const hasAdmin = (count || 0) > 0;
    console.log('✅ Admin check result:', { hasAdmin, count });

    return NextResponse.json({ 
      hasAdmin,
      adminCount: count || 0
    });

  } catch (error: any) {
    console.error('❌ Check admin exception:', error);
    // Jika ada exception, asumsikan sudah ada admin untuk keamanan
    return NextResponse.json({ hasAdmin: true, adminCount: 1, error: error.message });
  }
}
