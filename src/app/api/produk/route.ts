import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireMitraOrAdmin, requireAuth } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper untuk memformat data dari DB ke format yang dimengerti Frontend
function formatProduk(raw: any) {
  return {
    id: raw.id,
    nama: raw.nama,
    harga: raw.harga,
    deskripsi: raw.deskripsi,
    gambar: raw.gambar,
    kategori: raw.kategori,
    berat: raw.berat,
    porsi: raw.porsi,
    stok: raw.stok || 0,
    tersedia: raw.tersedia !== false, // Default true jika undefined
    rating: raw.rating || 0,
    totalTerjual: raw.total_terjual || 0,
    mitraId: raw.mitra_id,
    mitraNama: raw.mitra_nama,
    mitraTier: raw.mitra_tier,
  };
}

// GET - Get all products or search (Server-side filtering)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kategori = searchParams.get('kategori');
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    // Gunakan Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // 1. Get single product
    if (id) {
      const { data: rawProduk, error } = await supabase
        .from('produk')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !rawProduk) {
        return NextResponse.json(
          { success: false, message: 'Produk tidak ditemukan' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, produk: formatProduk(rawProduk) });
    }

    // 2. Query with server-side filtering (Faster than client-side)
    let query = supabase
      .from('produk')
      .select('id, nama, harga, gambar, kategori, berat, porsi, stok, tersedia, rating, total_terjual, mitra_id, mitra_nama, mitra_tier, created_at', { count: 'exact' })
      .eq('tersedia', true)
      .order('created_at', { ascending: false });

    if (kategori && kategori !== 'Semua') {
      query = query.eq('kategori', kategori);
    }

    if (search) {
      // Validate search length
      if (search.length > 200) {
        return NextResponse.json(
          { success: false, message: 'Pencarian terlalu panjang' },
          { status: 400 }
        );
      }
      query = query.ilike('nama', `%${search}%`);
    }

    // 3. Pagination
    const offset = (page - 1) * limit;
    const { data: rawProduk, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase Fetch Error:", error);
      throw error;
    }

    // Handle null/empty data
    const formattedProduk = (rawProduk || []).map(formatProduk);
    return NextResponse.json({
      success: true,
      produk: formattedProduk,
      total: count || 0,
      page,
      limit
    });

  } catch (error: any) {
    console.error('Produk API ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal memuat produk' },
      { status: 500 }
    );
  }
}

// POST - Create product (requires mitra or admin auth)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireMitraOrAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate required fields
    if (!body.nama || !body.harga || !body.mitra_id) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Validate data types and ranges
    if (typeof body.harga !== 'number' || body.harga < 0) {
      return NextResponse.json(
        { success: false, message: 'Harga tidak valid' },
        { status: 400 }
      );
    }

    if (body.stok !== undefined && (typeof body.stok !== 'number' || body.stok < 0)) {
      return NextResponse.json(
        { success: false, message: 'Stok tidak valid' },
        { status: 400 }
      );
    }

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['nama', 'harga', 'deskripsi', 'gambar', 'kategori', 'berat', 'porsi', 'stok', 'tersedia', 'mitra_id'];
    const sanitizedBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const { data: produk, error } = await supabase
      .from('produk')
      .insert(sanitizedBody)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal membuat produk' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, produk });
  } catch (error: any) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat membuat produk' },
      { status: 500 }
    );
  }
}

// PUT - Update product (requires mitra or admin auth)
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireMitraOrAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID produk diperlukan' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      );
    }

    // Whitelist allowed fields
    const allowedFields = ['nama', 'harga', 'deskripsi', 'gambar', 'kategori', 'berat', 'porsi', 'stok', 'tersedia'];
    const sanitizedBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const { data: produk, error } = await supabase
      .from('produk')
      .update(sanitizedBody)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal mengupdate produk' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, produk });
  } catch (error: any) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengupdate produk' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (requires mitra or admin auth)
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireMitraOrAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID produk diperlukan' },
        { status: 400 }
      );
    }

    // Validate ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, message: 'ID tidak valid' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase.from('produk').delete().eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { success: false, message: 'Gagal menghapus produk' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat menghapus produk' },
      { status: 500 }
    );
  }
}
