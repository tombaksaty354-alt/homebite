import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
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

      // Gabungkan data secara manual di sini
      const enrichedOrders = orders.map(order => {
        const customer = users?.find(u => u.id === order.customer_id);
        const mitra = users?.find(u => u.id === order.mitra_id);
        
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
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      // Get all orders in period simply
      const { data: orders, error } = await supabase
        .from('orders')
        .select('mitra_id, total_bayar, created_at, status')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Fetch users for names
      const { data: users } = await supabase.from('users').select('id, nama');

      // Process stats
      const stats: Record<string, { nama: string; totalPendapatan: number; totalOrder: number; orderSelesai: number }> = {};
      
      orders?.forEach(o => {
        const mid = o.mitra_id;
        // Find name manually
        const user = users?.find(u => u.id === mid);
        const nama = user?.nama || 'Unknown Mitra';
        
        if (!stats[mid]) stats[mid] = { nama, totalPendapatan: 0, totalOrder: 0, orderSelesai: 0 };
        
        stats[mid].totalOrder += 1;
        if (o.status === 'lunas' || o.status === 'selesai') {
          stats[mid].totalPendapatan += o.total_bayar || 0;
          if (o.status === 'selesai') stats[mid].orderSelesai += 1;
        }
      });

      return NextResponse.json({ success: true, data: Object.values(stats) });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
