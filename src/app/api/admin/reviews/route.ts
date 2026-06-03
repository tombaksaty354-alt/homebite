import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch all reviews for moderation
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        users:customer_id (nama, email),
        produk:produk_id (nama)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (rating && rating !== 'all') {
      query = query.eq('rating', parseInt(rating));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ success: false, error: 'Gagal mengambil data ulasan' }, { status: 500 });
    }

    // Transform data for frontend
    const reviews = (data || []).map((r: any) => ({
      id: r.id,
      customer_name: r.users?.nama || 'Unknown',
      customer_email: r.users?.email || '',
      produk_name: r.produk?.nama || 'Unknown',
      produk_id: r.produk_id,
      rating: r.rating,
      komentar: r.komentar,
      status: r.status || 'pending',
      created_at: r.created_at,
      moderated_at: r.moderated_at,
    }));

    // Also compute stats
    const stats = {
      total: reviews.length,
      pending: reviews.filter((r: any) => r.status === 'pending').length,
      approved: reviews.filter((r: any) => r.status === 'approved').length,
      rejected: reviews.filter((r: any) => r.status === 'rejected').length,
      avgRating: reviews.length > 0
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : '0',
    };

    return NextResponse.json({ success: true, data: reviews, stats });

  } catch (error: any) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PATCH: Approve or reject a review
export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { reviewId, action } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json({ success: false, error: 'reviewId dan action diperlukan' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action harus "approve" atau "reject"' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { error } = await supabase
      .from('reviews')
      .update({
        status: newStatus,
        moderated_at: new Date().toISOString(),
        moderated_by: auth.user.id,
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Error moderating review:', error);
      return NextResponse.json({ success: false, error: 'Gagal memperbarui ulasan' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { reviewId, status: newStatus }
    });

  } catch (error: any) {
    console.error('Review moderation error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
