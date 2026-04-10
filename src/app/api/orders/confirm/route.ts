import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST - Confirm order completion (server-side for escrow security)
export async function POST(request: Request) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const user = auth.user;
    const body = await request.json();
    const { orderId, notes } = body;

    // Validate input
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID pesanan diperlukan' },
        { status: 400 }
      );
    }

    // Validate orderId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      return NextResponse.json(
        { success: false, error: 'Format ID pesanan tidak valid' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Fetch order to validate
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    // STEP 2: Validate that user owns this order
    if (order.customer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Anda tidak memiliki akses ke pesanan ini' },
        { status: 403 }
      );
    }

    // STEP 3: Validate order status - only allow completion if status is 'dikirim'
    if (order.status !== 'dikirim') {
      return NextResponse.json(
        { success: false, error: `Pesanan tidak dapat dikonfirmasi. Status saat ini: ${order.status}` },
        { status: 400 }
      );
    }

    // STEP 4: Check if minimum delivery time has passed (e.g., 1 hour since shipped)
    // This prevents instant completion right after mitra marks as shipped
    const shippedAt = new Date(order.shipped_at || order.updated_at);
    const now = new Date();
    const hoursSinceShipped = (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60);

    // Optional: Require minimum time before confirmation (uncomment if needed)
    // if (hoursSinceShipped < 1) {
    //   return NextResponse.json(
    //     { success: false, error: 'Pesanan baru saja dikirim. Tunggu beberapa saat sebelum mengonfirmasi.' },
    //     { status: 400 }
    //   );
    // }

    // STEP 5: Update order to 'selesai' with timestamp
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'selesai',
        received_at: now.toISOString(),
        catatan_customer: notes || null,
        escrow_released_at: now.toISOString(), // Track when escrow was released
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error confirming order:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengonfirmasi pesanan' },
        { status: 500 }
      );
    }

    // STEP 6: Update product total_terjual
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('produk_id, jumlah')
      .eq('order_id', orderId);

    if (orderItems) {
      for (const item of orderItems) {
        try {
          // Try to call RPC to increment sales (if function exists)
          await supabase.rpc('increment_product_sales', { 
            product_id: item.produk_id, 
            quantity: item.jumlah 
          });
        } catch (err) {
          console.error('Error updating product sales:', err);
          // RPC function may not exist - that's okay
          // Sales can be calculated from order_items table
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dikonfirmasi! Dana telah diteruskan ke mitra.'
    });

  } catch (error: any) {
    console.error('Order confirmation error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat mengonfirmasi pesanan' },
      { status: 500 }
    );
  }
}
