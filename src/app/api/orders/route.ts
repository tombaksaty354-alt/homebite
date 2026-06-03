import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/server-auth';
import { sanitizeOrderPayload } from '@/lib/sanitize';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Generate unique order number with collision check
async function generateUniqueOrderNumber(supabase: any): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  const orderNumber = `HB-${timestamp}-${random}`;
  
  // Check for collision
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('nomor_pesanan', orderNumber)
    .single();
  
  if (existing) {
    // Collision detected, generate again with different random
    return generateUniqueOrderNumber(supabase);
  }
  
  return orderNumber;
}

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`orders:${clientIp}`, RATE_LIMITS.orders.maxRequests, RATE_LIMITS.orders.windowMs);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rateLimitResult.retryAfterMs || 60000) / 1000)) },
        }
      );
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const user = auth.user;
    const body = await request.json();

    // Sanitize and validate all input data
    const sanitized = sanitizeOrderPayload(body);
    if (!sanitized.valid || !sanitized.data) {
      return NextResponse.json(
        { success: false, error: sanitized.error || 'Data tidak valid' },
        { status: 400 }
      );
    }

    const { items, alamat } = sanitized.data;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Item pesanan diperlukan' },
        { status: 400 }
      );
    }

    if (!alamat || !alamat.id || !alamat.alamat || !alamat.kota || !alamat.provinsi) {
      return NextResponse.json(
        { success: false, error: 'Alamat pengiriman diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Validate stock and availability for ALL items first
    const productIds = items.map((item: any) => item.id);
    const { data: products, error: productsError } = await supabase
      .from('produk')
      .select('id, nama, harga, stok, tersedia, mitra_id')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { success: false, error: 'Gagal memvalidasi produk' },
        { status: 500 }
      );
    }

    // Create product lookup map
    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    // Validate each item
    for (const item of items) {
      const product = productMap.get(item.id);
      
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produk "${item.nama}" tidak ditemukan` },
          { status: 400 }
        );
      }

      if (!product.tersedia) {
        return NextResponse.json(
          { success: false, error: `Produk "${product.nama}" tidak tersedia` },
          { status: 400 }
        );
      }

      if (product.stok !== null && product.stok < item.jumlah) {
        return NextResponse.json(
          { success: false, error: `Stok "${product.nama}" tidak cukup. Tersedia: ${product.stok}` },
          { status: 400 }
        );
      }

      // Validate price hasn't changed significantly (>5% difference)
      const priceDiff = Math.abs(product.harga - item.harga) / item.harga;
      if (priceDiff > 0.05) {
        return NextResponse.json(
          { success: false, error: `Harga "${product.nama}" berubah. Harga sekarang: Rp${product.harga.toLocaleString('id-ID')}` },
          { status: 400 }
        );
      }
    }

    // STEP 2: Group items by mitra
    const groupedItems: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const product = productMap.get(item.id);
      const mitraId = product?.mitra_id;
      if (!mitraId) {
        throw new Error(`Produk "${item.nama}" tidak memiliki mitra`);
      }
      if (!groupedItems[mitraId]) groupedItems[mitraId] = [];
      groupedItems[mitraId].push({ ...item, product });
    });

    // STEP 3: Create orders with transaction-like behavior
    const createdOrders: any[] = [];

    for (const mitraId in groupedItems) {
      const mitraItems = groupedItems[mitraId];
      const subtotal = mitraItems.reduce((sum, item) => sum + (item.product.harga * item.jumlah), 0);

      // Generate unique order number
      const nomorPesanan = await generateUniqueOrderNumber(supabase);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          mitra_id: mitraId,
          nomor_pesanan: nomorPesanan,
          status: 'menunggu_ongkir',
          subtotal_produk: subtotal,
          ongkir: 0,
          total_bayar: subtotal,
          alamat_lengkap: alamat.alamat,
          kota: alamat.kota,
          provinsi: alamat.provinsi,
          kode_pos: alamat.kode_pos,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error('Error creating order:', orderError);
        
        // Rollback already created orders
        for (const createdOrder of createdOrders) {
          await supabase.from('orders').delete().eq('id', createdOrder.id);
        }
        
        return NextResponse.json(
          { success: false, error: 'Gagal membuat pesanan' },
          { status: 500 }
        );
      }

      // Create order items
      const orderItems = mitraItems.map(item => ({
        order_id: order.id,
        produk_id: item.id,
        jumlah: item.jumlah,
        harga_satuan: item.product.harga,
        subtotal: item.product.harga * item.jumlah,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        
        // Rollback: delete this order and all previous orders
        await supabase.from('orders').delete().eq('id', order.id);
        for (const createdOrder of createdOrders) {
          await supabase.from('orders').delete().eq('id', createdOrder.id);
        }
        
        return NextResponse.json(
          { success: false, error: 'Gagal menyimpan item pesanan' },
          { status: 500 }
        );
      }

      // STEP 4: Reduce stock for each product
      for (const item of mitraItems) {
        if (item.product.stok !== null) {
          const newStock = item.product.stok - item.jumlah;
          const { error: stockError } = await supabase
            .from('produk')
            .update({ stok: newStock })
            .eq('id', item.id);
          
          if (stockError) {
            console.error('Error updating stock:', stockError);
            // Don't fail the order, just log the error
            // Stock can be manually corrected later
          }
        }
      }

      createdOrders.push(order);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderIds: createdOrders.map(o => o.id),
        orderCount: createdOrders.length
      }
    });

  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat membuat pesanan' },
      { status: 500 }
    );
  }
}
