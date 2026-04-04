import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    if (!supabaseServiceKey) throw new Error('Service key missing');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'pending', 'generate', 'invoices'
    const periode = searchParams.get('periode') || new Date().toISOString().slice(0, 7);

    // 1. GET PENDING ORDERS SUMMARY
    if (action === 'pending') {
      // Get all done orders
      const { data: allDoneOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, mitra_id, status')
        .in('status', ['lunas', 'selesai']);

      if (ordersError) throw ordersError;

      // Get all invoiced items
      const { data: invoicedOrders, error: invError } = await supabase
        .from('invoices')
        .select('mitra_id, periode, total_items');

      if (invError) throw invError;

      const invoicedItems = invoicedOrders?.reduce((sum: number, inv: any) => sum + (inv.total_items || 0), 0) || 0;

      // Get all items from done orders
      const orderIds = allDoneOrders?.map(o => o.id) || [];
      let totalItems = 0;
      
      if (orderIds.length > 0) {
        const { data: allItems } = await supabase
          .from('order_items')
          .select('order_id, jumlah')
          .in('order_id', orderIds);
        
        totalItems = allItems?.reduce((sum: number, i: any) => sum + i.jumlah, 0) || 0;
      }

      const pendingItems = totalItems - invoicedItems;
      const mitraIds = [...new Set(allDoneOrders?.map(o => o.mitra_id) || [])];
      const invoicedMitras = [...new Set(invoicedOrders?.map((inv: any) => inv.mitra_id) || [])];

      return NextResponse.json({
        success: true,
        data: {
          count: allDoneOrders?.length || 0,
          items: Math.max(0, pendingItems),
          mitras: Math.max(0, mitraIds.length - invoicedMitras.length),
          totalItems,
          invoicedItems
        }
      });
    }

    // 2. GENERATE INVOICES
    if (action === 'generate') {
      // Get all done orders
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, mitra_id, status')
        .in('status', ['lunas', 'selesai']);

      if (ordersError) throw ordersError;

      if (!allOrders || allOrders.length === 0) {
        return NextResponse.json({
          success: true,
          data: { created: 0, updated: 0, message: 'No orders found' }
        });
      }

      // Get all items
      const orderIds = allOrders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, jumlah')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Group by mitra
      const orderToMitra: Record<string, string> = {};
      allOrders.forEach(order => { orderToMitra[order.id] = order.mitra_id; });

      const mitraStats: Record<string, { totalItems: number; orderCount: number }> = {};
      
      items?.forEach((item: any) => {
        const mitraId = orderToMitra[item.order_id];
        if (!mitraId) return;
        if (!mitraStats[mitraId]) mitraStats[mitraId] = { totalItems: 0, orderCount: 0 };
        mitraStats[mitraId].totalItems += item.jumlah;
      });

      allOrders.forEach(order => {
        if (mitraStats[order.mitra_id]) mitraStats[order.mitra_id].orderCount++;
      });

      const KOMISI_PER_ITEM = 500;
      let created = 0;
      let updated = 0;

      for (const [mitraId, stats] of Object.entries(mitraStats)) {
        const totalAmount = stats.totalItems * KOMISI_PER_ITEM;

        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id, total_items, total_amount')
          .eq('mitra_id', mitraId)
          .eq('periode', periode)
          .single();

        if (existingInvoice) {
          await supabase
            .from('invoices')
            .update({ total_items: stats.totalItems, total_amount: totalAmount })
            .eq('id', existingInvoice.id);
          updated++;
        } else {
          await supabase
            .from('invoices')
            .insert({
              mitra_id: mitraId,
              periode,
              total_items: stats.totalItems,
              total_amount: totalAmount,
              status: 'unpaid'
            });
          created++;
        }
      }

      const totalAllItems = Object.values(mitraStats).reduce((sum: number, s: any) => sum + s.totalItems, 0);
      const totalAllKomisi = totalAllItems * KOMISI_PER_ITEM;

      return NextResponse.json({
        success: true,
        data: {
          created,
          updated,
          totalOrders: allOrders.length,
          totalItems: totalAllItems,
          totalKomisi: totalAllKomisi,
          mitraCount: Object.keys(mitraStats).length
        }
      });
    }

    // 3. GET INVOICES
    if (action === 'invoices') {
      const status = searchParams.get('status');
      
      // Get invoices first
      let query = supabase.from('invoices').select('*');

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: invoices, error: invoicesError } = await query.order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      if (!invoices) return NextResponse.json({ success: true, data: [] });

      // Get user names separately
      const mitraIds = [...new Set(invoices.map(inv => inv.mitra_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, nama, email')
        .in('id', mitraIds);

      // Enrich invoices with user data
      const enrichedInvoices = invoices.map(inv => {
        const user = users?.find(u => u.id === inv.mitra_id);
        return {
          ...inv,
          users: user ? { nama: user.nama, email: user.email } : { nama: 'Unknown', email: '-' }
        };
      });

      return NextResponse.json({ success: true, data: enrichedInvoices });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Invoice API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseServiceKey) throw new Error('Service key missing');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await request.json();
    const { action, invoiceId, status, bukti_bayar } = body;

    // Verify payment
    if (action === 'verify') {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          dibayar_pada: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    // Upload payment proof
    if (action === 'upload_proof') {
      const { error } = await supabase
        .from('invoices')
        .update({
          bukti_bayar,
          status: 'waiting_confirmation',
          dibayar_pada: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Invoice POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
