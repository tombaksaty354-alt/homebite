import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST: Submit payment proof for an order
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { orderId, buktiPembayaran, metodePembayaran, pembayaranMetode } = body;

    if (!orderId || !buktiPembayaran) {
      return NextResponse.json(
        { success: false, error: 'Order ID dan bukti pembayaran wajib diisi' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify this order belongs to the authenticated user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, customer_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (order.customer_id !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke pesanan ini' },
        { status: 403 }
      );
    }

    // Update order with payment proof
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        bukti_pembayaran: buktiPembayaran,
        status_bukti: 'menunggu_konfirmasi',
        metode_pembayaran: metodePembayaran || 'transfer',
        pembayaran_metode: pembayaranMetode || metodePembayaran || 'transfer',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order payment proof:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan bukti pembayaran: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Bukti pembayaran berhasil dikirim' });

  } catch (error: any) {
    console.error('Payment proof API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
