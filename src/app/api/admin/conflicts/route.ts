import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch all conflicts (admin only)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');

    let query = supabase
      .from('conflicts')
      .select(`
        *,
        customer:customer_id (nama, email),
        mitra:mitra_id (nama, email)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conflicts:', error);
      return NextResponse.json({ success: false, error: 'Gagal mengambil data konflik' }, { status: 500 });
    }

    const conflicts = (data || []).map((c: any) => ({
      id: c.id,
      order_id: c.order_id,
      nomor_pesanan: c.nomor_pesanan,
      customer_name: c.customer?.nama || 'Unknown',
      mitra_name: c.mitra?.nama || 'Unknown',
      type: c.type,
      priority: c.priority,
      message: c.message,
      status: c.status,
      resolution: c.resolution,
      refund_amount: c.refund_amount,
      total_bayar: c.total_bayar,
      created_at: c.created_at,
      resolved_at: c.resolved_at,
    }));

    const stats = {
      open: conflicts.filter((c: any) => c.status === 'open').length,
      investigating: conflicts.filter((c: any) => c.status === 'investigating').length,
      resolved: conflicts.filter((c: any) => c.status === 'resolved').length,
      totalRefund: conflicts.filter((c: any) => c.status === 'resolved').reduce((sum: number, c: any) => sum + (c.refund_amount || 0), 0),
    };

    return NextResponse.json({ success: true, data: conflicts, stats });

  } catch (error: any) {
    console.error('Conflicts fetch error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST: Create a new conflict (customer submits complaint)
export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { orderId, type, priority, message } = await request.json();

    if (!orderId || !type || !message) {
      return NextResponse.json({ success: false, error: 'orderId, type, dan message diperlukan' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, nomor_pesanan, customer_id, mitra_id, total_bayar')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    // Verify customer owns the order
    if (order.customer_id !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Tidak memiliki akses ke pesanan ini' }, { status: 403 });
    }

    // Create conflict
    const { data: conflict, error: conflictError } = await supabase
      .from('conflicts')
      .insert({
        order_id: orderId,
        nomor_pesanan: order.nomor_pesanan,
        customer_id: order.customer_id,
        mitra_id: order.mitra_id,
        type,
        priority: priority || 'medium',
        message,
        total_bayar: order.total_bayar || 0,
        status: 'open',
      })
      .select()
      .single();

    if (conflictError) {
      console.error('Error creating conflict:', conflictError);
      return NextResponse.json({ success: false, error: 'Gagal membuat laporan konflik' }, { status: 500 });
    }

    // Notify admin
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        try {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            title: '⚠️ Keluhan Baru',
            message: `Keluhan baru untuk pesanan ${order.nomor_pesanan}: ${type}`,
            tipe: 'warning',
            link: '/admin/konflik',
            dibaca: false,
          });
        } catch { /* ignore notification failure */ }
      }
    }

    return NextResponse.json({ success: true, data: conflict });

  } catch (error: any) {
    console.error('Conflict creation error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH: Update conflict status / process refund
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { conflictId, action, resolution } = await request.json();

    if (!conflictId || !action) {
      return NextResponse.json({ success: false, error: 'conflictId dan action diperlukan' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch conflict
    const { data: conflict, error: conflictError } = await supabase
      .from('conflicts')
      .select('*')
      .eq('id', conflictId)
      .single();

    if (conflictError || !conflict) {
      return NextResponse.json({ success: false, error: 'Konflik tidak ditemukan' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'investigate':
        updateData = { status: 'investigating' };
        break;

      case 'resolve':
        updateData = {
          status: 'resolved',
          resolution: resolution || 'Masalah terselesaikan melalui mediasi',
          resolved_at: new Date().toISOString(),
          resolved_by: auth.user.id,
        };
        break;

      case 'refund':
        // Process 100% refund
        updateData = {
          status: 'resolved',
          resolution: 'Refund 100% telah diproses',
          refund_amount: conflict.total_bayar,
          resolved_at: new Date().toISOString(),
          resolved_by: auth.user.id,
        };

        // Update order refund status
        if (conflict.order_id) {
          await supabase
            .from('orders')
            .update({
              refund_status: 'processed',
              status: 'dibatalkan',
              cancel_reason: `Refund: ${conflict.type}`,
              canceled_at: new Date().toISOString(),
            })
            .eq('id', conflict.order_id);
        }

        // Notify customer about refund
        if (conflict.customer_id) {
          try {
            await supabase.from('notifications').insert({
              user_id: conflict.customer_id,
              title: '💸 Refund Diproses',
              message: `Refund Rp ${(conflict.total_bayar || 0).toLocaleString('id-ID')} untuk pesanan ${conflict.nomor_pesanan} telah diproses.`,
              tipe: 'success',
              link: '/pesanan',
              dibaca: false,
            });
          } catch { /* ignore notification failure */ }
        }
        break;

      default:
        return NextResponse.json({ success: false, error: `Action "${action}" tidak dikenali` }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('conflicts')
      .update(updateData)
      .eq('id', conflictId);

    if (updateError) {
      console.error('Error updating conflict:', updateError);
      return NextResponse.json({ success: false, error: 'Gagal memperbarui konflik' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { conflictId, ...updateData } });

  } catch (error: any) {
    console.error('Conflict update error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
