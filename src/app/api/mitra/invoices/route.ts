import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireMitraOrAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Get invoices for current mitra
export async function GET(request: Request) {
  try {
    // Require mitra or admin authentication
    const auth = await requireMitraOrAdmin(request);
    if (auth.response) return auth.response;

    const user = auth.user;

    if (!supabaseServiceKey) throw new Error('Service key missing');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get invoices for THIS mitra only
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('mitra_id', user.id);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: invoices, error: invoicesError } = await query.order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching mitra invoices:', invoicesError);
      return NextResponse.json(
        { success: false, error: 'Gagal memuat invoice' },
        { status: 500 }
      );
    }
    
    if (!invoices) return NextResponse.json({ success: true, data: [] });

    return NextResponse.json({ success: true, data: invoices });

  } catch (error: any) {
    console.error('Mitra invoice API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memuat invoice' },
      { status: 500 }
    );
  }
}

// POST - Upload payment proof for invoice (mitra only)
export async function POST(request: Request) {
  try {
    // Require mitra or admin authentication
    const auth = await requireMitraOrAdmin(request);
    if (auth.response) return auth.response;

    const user = auth.user;

    if (!supabaseServiceKey) throw new Error('Service key missing');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { action, invoiceId, bukti_bayar } = body;

    // Validate input
    if (!action || !invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Aksi dan ID invoice diperlukan' },
        { status: 400 }
      );
    }

    // Validate invoiceId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'Format ID invoice tidak valid' },
        { status: 400 }
      );
    }

    // Verify invoice belongs to this mitra
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, mitra_id, status')
      .eq('id', invoiceId)
      .single();

    if (!invoice || invoice.mitra_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Invoice tidak ditemukan atau bukan milik Anda' },
        { status: 403 }
      );
    }

    // Upload payment proof
    if (action === 'upload_proof') {
      if (!bukti_bayar) {
        return NextResponse.json(
          { success: false, error: 'Bukti bayar diperlukan' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          bukti_bayar,
          status: 'waiting_confirmation',
          dibayar_pada: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error uploading payment proof:', error);
        return NextResponse.json(
          { success: false, error: 'Gagal mengupload bukti pembayaran' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Bukti pembayaran berhasil diupload'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Aksi tidak valid' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Mitra invoice POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan pada invoice' },
      { status: 500 }
    );
  }
}
