import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch logistics overview for admin
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch orders that are in logistics-related statuses
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, nomor_pesanan, status, created_at,
        driver_name, driver_phone, driver_vehicle, driver_plate,
        driver_allocated_at, pickup_at, eta_minutes,
        qr_scanned, qr_scanned_at, ready_at,
        shipped_at, received_at,
        customer:customer_id (nama),
        mitra:mitra_id (nama)
      `)
      .in('status', ['siap_dikirim', 'dijemput', 'dikirim', 'selesai'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching logistics:', error);
      return NextResponse.json({ success: false, error: 'Gagal mengambil data logistik' }, { status: 500 });
    }

    const logistics = (data || []).map((o: any) => ({
      id: o.id,
      nomor_pesanan: o.nomor_pesanan,
      status: o.status,
      customer_name: o.customer?.nama || 'Unknown',
      mitra_name: o.mitra?.nama || 'Unknown',
      driver_name: o.driver_name,
      driver_phone: o.driver_phone,
      driver_vehicle: o.driver_vehicle,
      driver_plate: o.driver_plate,
      driver_allocated_at: o.driver_allocated_at,
      pickup_at: o.pickup_at,
      eta: o.eta_minutes,
      qr_scanned: o.qr_scanned || false,
      qr_scanned_at: o.qr_scanned_at,
      ready_at: o.ready_at,
      shipped_at: o.shipped_at,
      created_at: o.created_at,
    }));

    const stats = {
      ready: logistics.filter((l: any) => l.status === 'siap_dikirim').length,
      pickup: logistics.filter((l: any) => l.status === 'dijemput').length,
      delivering: logistics.filter((l: any) => l.status === 'dikirim').length,
      completed: logistics.filter((l: any) => l.status === 'selesai').length,
    };

    return NextResponse.json({ success: true, data: logistics, stats });

  } catch (error: any) {
    console.error('Logistics overview error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
