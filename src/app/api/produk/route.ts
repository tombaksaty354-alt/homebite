import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

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
      query = query.ilike('nama', `%${search}%`);
    }

    // 3. Pagination
    const offset = (page - 1) * limit;
    const { data: rawProduk, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase Fetch Error:", error);
      throw error;
    }

    const formattedProduk = rawProduk.map(formatProduk);
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
      { success: false, message: 'Gagal memuat produk: ' + error.message },
      { status: 500 }
    );
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!body.nama || !body.harga || !body.mitra_id) {
      return NextResponse.json({ success: false, message: 'Data tidak lengkap' }, { status: 400 });
    }

    const { data: produk, error } = await supabase
      .from('produk')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, produk });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("ID diperlukan");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();

    const { data: produk, error } = await supabase
      .from('produk')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, produk });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("ID diperlukan");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase.from('produk').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
