import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireRole } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Simulated driver pool (will be replaced with real API integration later)
const DRIVER_POOL = [
  { name: "Ahmad Ridwan", phone: "0812-3456-7890", vehicle: "Honda Vario 160", plate: "B 1234 XYZ" },
  { name: "Budi Setiawan", phone: "0813-9876-5432", vehicle: "Yamaha NMAX", plate: "B 5678 ABC" },
  { name: "Cahya Pratama", phone: "0811-2233-4455", vehicle: "Honda Beat", plate: "B 9012 DEF" },
  { name: "Dian Kurniawan", phone: "0857-6677-8899", vehicle: "Honda PCX", plate: "B 3456 GHI" },
  { name: "Eko Prasetyo", phone: "0821-1122-3344", vehicle: "Yamaha Aerox", plate: "B 7890 JKL" },
];

// POST: Allocate driver for an order
export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ['mitra', 'admin']);
    if (auth.response) return auth.response;

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId diperlukan' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify order exists and belongs to this mitra
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, mitra_id, nomor_pesanan')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // Verify ownership (mitra can only allocate their own orders)
    if (auth.user.role === 'mitra' && order.mitra_id !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses ke pesanan ini' }, { status: 403 });
    }

    // Verify order is in correct status
    if (order.status !== 'siap_dikirim') {
      return NextResponse.json({ 
        success: false, 
        error: `Pesanan harus berstatus "siap_dikirim". Status saat ini: "${order.status}"` 
      }, { status: 400 });
    }

    // Simulate driver allocation (random driver + random ETA)
    const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
    const eta = Math.floor(Math.random() * 10) + 5; // 5-15 minutes

    // Update order with driver info and change status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'dijemput',
        driver_name: driver.name,
        driver_phone: driver.phone,
        driver_vehicle: driver.vehicle,
        driver_plate: driver.plate,
        driver_allocated_at: new Date().toISOString(),
        eta_minutes: eta,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error allocating driver:', updateError);
      return NextResponse.json({ success: false, error: 'Gagal mengalokasikan driver' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle,
          plateNumber: driver.plate,
          eta,
        },
        orderId,
        status: 'dijemput',
      }
    });

  } catch (error: any) {
    console.error('Driver allocation error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH: Update logistics status (QR scan, mark delivered, etc.)
export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { orderId, action, ...extraData } = await request.json();

    if (!orderId || !action) {
      return NextResponse.json({ success: false, error: 'orderId dan action diperlukan' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'qr_scan':
        // Driver scans QR code at pickup
        if (order.qr_scanned) {
          return NextResponse.json({ success: false, error: 'QR sudah dipindai sebelumnya' }, { status: 400 });
        }
        updateData = {
          qr_scanned: true,
          qr_scanned_at: new Date().toISOString(),
        };
        break;

      case 'mark_delivering':
        // Driver confirms pickup, starts delivery
        if (order.status !== 'dijemput') {
          return NextResponse.json({ success: false, error: 'Status harus "dijemput"' }, { status: 400 });
        }
        updateData = {
          status: 'dikirim',
          pickup_at: new Date().toISOString(),
        };
        break;

      case 'update_eta':
        // Update ETA
        if (extraData.eta_minutes) {
          updateData = { eta_minutes: extraData.eta_minutes };
        }
        break;

      default:
        return NextResponse.json({ success: false, error: `Action "${action}" tidak dikenali` }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating logistics:', updateError);
      return NextResponse.json({ success: false, error: 'Gagal memperbarui status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { orderId, action, ...updateData } });

  } catch (error: any) {
    console.error('Logistics update error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
