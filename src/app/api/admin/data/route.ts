import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    // Require admin authentication
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    if (!supabaseServiceKey) throw new Error('Service key missing');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'orders' or 'stats'

    // 1. REKAP PESANAN
    if (type === 'orders') {
      // Fetch orders simply (tanpa join rumit yang sering error)
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!orders) return NextResponse.json({ success: true, data: [] });

      // Fetch users untuk mendapatkan nama Customer & Mitra
      const { data: users } = await supabase.from('users').select('id, nama, email, role');

      // Build user lookup map for O(1) performance
      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      // Gabungkan data secara manual di sini
      const enrichedOrders = orders.map(order => {
        const customer = userMap.get(order.customer_id);
        const mitra = userMap.get(order.mitra_id);

        return {
          ...order,
          customer: customer ? { nama: customer.nama, email: customer.email } : { nama: 'Unknown', email: '-' },
          mitra: mitra ? { nama: mitra.nama, email: mitra.email } : { nama: 'Unknown', email: '-' }
        };
      });

      return NextResponse.json({ success: true, data: enrichedOrders });
    }

    // 2. STATISTIK MITRA
    if (type === 'stats') {
      const period = searchParams.get('period') || '7'; // days
      
      // Validate period
      const periodNum = parseInt(period);
      if (isNaN(periodNum) || periodNum < 1 || periodNum > 365) {
        return NextResponse.json(
          { error: 'Periode tidak valid (1-365 hari)' },
          { status: 400 }
        );
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodNum);

      // Get all orders in period simply
      const { data: orders, error } = await supabase
        .from('orders')
        .select('mitra_id, total_bayar, created_at, status')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Fetch users for names
      const { data: users } = await supabase.from('users').select('id, nama');

      // Build user lookup map
      const userMap = new Map(users?.map(u => [u.id, u.nama]) || []);

      // Process stats
      const stats: Record<string, { nama: string; totalPendapatan: number; totalOrder: number; orderSelesai: number }> = {};

      orders?.forEach(o => {
        const mid = o.mitra_id;
        const nama = userMap.get(mid) || 'Unknown Mitra';

        if (!stats[mid]) stats[mid] = { nama, totalPendapatan: 0, totalOrder: 0, orderSelesai: 0 };

        stats[mid].totalOrder += 1;
        if (o.status === 'lunas' || o.status === 'selesai') {
          stats[mid].totalPendapatan += o.total_bayar || 0;
          if (o.status === 'selesai') stats[mid].orderSelesai += 1;
        }
      });

      return NextResponse.json({ success: true, data: Object.values(stats) });
    }

    return NextResponse.json(
      { success: false, error: 'Tipe tidak valid. Gunakan "orders" atau "stats"' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Admin data API error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data' },
      { status: 500 }
    );
  }
}
