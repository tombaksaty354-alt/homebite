import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const user = auth.user;
    const body = await request.json();
    const { orderId, ongkir, jasaWebsite } = body;

    // Validate inputs
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID Pesanan wajib diisi' },
        { status: 400 }
      );
    }

    const ongkirNum = parseInt(ongkir, 10);
    const jasaWebsiteNum = parseInt(jasaWebsite, 10);

    if (isNaN(ongkirNum) || ongkirNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Ongkir harus berupa angka positif' },
        { status: 400 }
      );
    }

    if (isNaN(jasaWebsiteNum) || jasaWebsiteNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Jasa website harus berupa angka positif' },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service key tidak dikonfigurasi' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch existing order to verify status and get subtotal_produk
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, subtotal_produk, nomor_pesanan, customer_id')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (order.status !== 'menunggu_ongkir') {
      return NextResponse.json(
        { success: false, error: `Status pesanan saat ini adalah "${order.status}", tidak dapat menentukan ongkir` },
        { status: 400 }
      );
    }

    const totalBayar = order.subtotal_produk + ongkirNum + jasaWebsiteNum;

    // Update order with shipping cost, website fee, and change status to menunggu_pembayaran
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        ongkir: ongkirNum,
        jasa_website: jasaWebsiteNum,
        total_bayar: totalBayar,
        status: 'menunggu_pembayaran',
        ongkir_set_by: user.id,
        ongkir_set_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      console.error('Error updating order shipping cost:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui biaya pengiriman pesanan' },
        { status: 500 }
      );
    }

    // Explicitly add an extra notification from the system specifying the platform fee
    try {
      await supabase.from('notifications').insert({
        user_id: order.customer_id,
        title: '💼 Rincian Biaya Layanan',
        message: `Pesanan ${order.nomor_pesanan} dikenakan Jasa Platform sebesar Rp ${jasaWebsiteNum.toLocaleString('id-ID')}. Silakan periksa rincian pembayaran.`,
        tipe: 'info',
        link: '/pesanan',
        dibaca: false,
      });
    } catch (notifErr) {
      console.error('Error creating platform fee notification:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Biaya pengiriman dan jasa website berhasil ditentukan',
      data: updatedOrder
    });

  } catch (error: any) {
    console.error('Error in set-ongkir route:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
