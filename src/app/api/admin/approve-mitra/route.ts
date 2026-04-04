import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Create mitra user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, nama, telepon, kota } = body;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service key missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    if (authData?.user) {
      // 2. Insert into users table
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          nama,
          role: 'mitra',
          tier: 'silver',
          status: 'active',
          telepon,
          kota,
        });

      if (dbError) throw dbError;

      return NextResponse.json({ success: true });
    }

  } catch (error: any) {
    console.error('Approve mitra error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update application status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, status, catatan_admin } = body;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service key missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('calon_mitra_applications')
      .update({ status, catatan_admin, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
