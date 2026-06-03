import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Require mitra or admin role
    const auth = await requireRole(request, ['mitra', 'admin']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { 
      orderId, 
      driverName, 
      driverPhone, 
      driverVehicle, 
      driverPlate, 
      screenshotUrl 
    } = body;

    // Validate inputs
    if (!orderId || !driverName || !driverPhone || !driverVehicle || !driverPlate || !screenshotUrl) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom formulir dan screenshot ojol wajib diisi' },
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

    // Fetch existing order to verify status and ownership
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, mitra_id, nomor_pesanan')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify ownership if role is mitra
    if (auth.user.role === 'mitra' && order.mitra_id !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki hak akses untuk memproses pesanan ini' },
        { status: 403 }
      );
    }

    // Verify status is "lunas"
    if (order.status !== 'lunas') {
      return NextResponse.json(
        { success: false, error: `Pesanan harus berstatus "lunas" untuk dikirim. Status saat ini: "${order.status}"` },
        { status: 400 }
      );
    }

    // Update order with driver info and shipping status
    const nowStr = new Date().toISOString();
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'dikirim',
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_vehicle: driverVehicle,
        driver_plate: driverPlate,
        screenshot_ojol: screenshotUrl,
        bukti_pengiriman_url: screenshotUrl,
        bukti_pengiriman_at: nowStr,
        driver_allocated_at: nowStr,
        pickup_at: nowStr
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError || !updatedOrder) {
      console.error('Error updating order with ojol logistics:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal memperbarui informasi pelacakan pesanan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Informasi pengiriman ojol berhasil disimpan dan status diperbarui ke dikirim',
      data: updatedOrder
    });

  } catch (error: any) {
    console.error('Error in ojol-upload logistics route:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
