"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useKeranjang } from "@/context/KeranjangContext";
import { useAuth, supabase } from "@/context/AuthContext";
import { showToast } from "@/components/ToastNotification";
import KartuProduk from "@/components/KartuProduk";
import { FaStar, FaShoppingCart, FaArrowLeft, FaStore, FaMapMarkerAlt, FaRegStar, FaStarHalfAlt, FaHeart, FaShare, FaImage, FaCheck } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import Image from "next/image";

export default function DetailProduk() {
  const params = useParams();
  const router = useRouter();
  const { tambahKeKeranjang } = useKeranjang();
  const { user } = useAuth();
  const [produk, setProduk] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, komentar: "" });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [mitraInfo, setMitraInfo] = useState<any>(null);
  const [produkRating, setProdukRating] = useState({ average: 0, count: 0 });
  const [quantity, setQuantity] = useState(1);

  const id = params?.id as string;

  useEffect(() => {
    fetchProduk();
  }, [id]);

  async function fetchProduk() {
    setLoading(true);
    if (!supabase || !id) {
      setLoading(false);
      return;
    }

    try {
      const { data: produkData } = await supabase
        .from("produk")
        .select("*")
        .eq("id", id)
        .single();

      if (!produkData) {
        setLoading(false);
        return;
      }

      setProduk(produkData);
      const allImages = [produkData.gambar, ...(produkData.gambar_ke || [])].filter(Boolean);
      setSelectedImage(allImages[0] || "");

      const [
        { data: reviewData },
        { data: mitraData },
        { data: related }
      ] = await Promise.all([
        supabase.from("reviews").select("*, users(nama, profile_picture)").eq("produk_id", id).order("created_at", { ascending: false }),
        produkData.mitra_id ? supabase.from("users").select("id, nama, alamat, kota, provinsi, telepon, tier, created_at, profile_picture").eq("id", produkData.mitra_id).single() : Promise.resolve({ data: null }),
        supabase.from("produk").select("*").eq("kategori", produkData.kategori).neq("id", id).limit(4)
      ]);

      if (reviewData) {
        setReviews(reviewData);
        if (reviewData.length > 0) {
          const totalRating = reviewData.reduce((sum, r) => sum + r.rating, 0);
          setProdukRating({
            average: Math.round((totalRating / reviewData.length) * 10) / 10,
            count: reviewData.length
          });
        }
      }

      if (related) setRelatedProducts(related);

      if (mitraData) {
        const [{ data: produkMitra }] = await Promise.all([
          supabase.from("produk").select("id").eq("mitra_id", mitraData.id)
        ]);

        const mitraProdukIds = produkMitra?.map(p => p.id) || [];
        const { data: reviewsMitra } = mitraProdukIds.length > 0
          ? await supabase.from("reviews").select("rating").in("produk_id", mitraProdukIds)
          : { data: [] };

        let mitraRating = 0;
        if (reviewsMitra && reviewsMitra.length > 0) {
          mitraRating = reviewsMitra.reduce((sum: any, r: any) => sum + r.rating, { rating: 0 }).rating / reviewsMitra.length;
        }

        setMitraInfo({
          ...mitraData,
          totalProduk: produkMitra?.length || 0,
          rating: Math.round(mitraRating * 10) / 10,
          bergabung: new Date(mitraData.created_at).getFullYear()
        });
      }

    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleTambahKeranjang = () => {
    if (!produk) return;
    if (!produk.tersedia) {
      showToast("error", "Stok produk habis");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      tambahKeKeranjang(produk);
    }
    showToast("success", `${quantity}x ${produk.nama} ditambahkan ke keranjang`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase || !produk) return;

    const existing = reviews.find(r => r.customer_id === user.id);
    if (existing) {
      showToast("info", "Anda sudah memberi review untuk produk ini");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      customer_id: user.id,
      produk_id: produk.id,
      rating: reviewForm.rating,
      komentar: reviewForm.komentar,
    });

    if (!error) {
      showToast("success", "Review berhasil dikirim!");
      setShowReviewForm(false);
      fetchProduk();
    }
  };

  if (loading) {
    return (
      <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
        <div className="container text-center">
          <div className="spinner-border mx-auto" style={{ color: '#e67e22', width: '3rem', height: '3rem' }} role="status" />
          <p className="mt-3 text-muted">Memuat produk...</p>
        </div>
      </section>
    );
  }

  if (!produk) {
    return (
      <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
        <div className="container text-center">
          <h2 className="fw-bold mb-3">Produk Tidak Ditemukan</h2>
          <button
            className="btn"
            onClick={() => router.push("/produk")}
            style={{ background: '#e67e22', color: 'white', borderRadius: '10px', padding: '12px 28px', fontWeight: 600, border: 'none' }}
          >
            <FaArrowLeft className="me-2" /> Kembali ke Produk
          </button>
        </div>
      </section>
    );
  }

  const renderStars = (rating: number, size: number = 16) => {
    const bintang = [];
    const penuh = Math.floor(rating);
    const setengah = rating % 1 !== 0;
    for (let i = 0; i < penuh; i++) bintang.push(<FaStar key={i} style={{ color: '#f39c12', fontSize: `${size}px` }} />);
    if (setengah) bintang.push(<FaStarHalfAlt key="half" style={{ color: '#f39c12', fontSize: `${size}px` }} />);
    const kosong = 5 - bintang.length;
    for (let i = 0; i < kosong; i++) bintang.push(<FaRegStar key={`e${i}`} style={{ color: '#f39c12', fontSize: `${size}px` }} />);
    return bintang;
  };

  const getTierBadge = (tier: string) => {
    const colors: any = {
      Silver: { bg: '#95a5a6', text: 'white' },
      Gold: { bg: '#f39c12', text: 'white' },
      Platinum: { bg: '#2c3e50', text: '#f39c12' }
    };
    const c = colors[tier] || colors.Silver;
    return (
      <span className="badge-modern d-inline-flex align-items-center gap-1" style={{ background: c.bg, color: c.text }}>
        <BsShieldCheck size={12} /> {tier}
      </span>
    );
  };

  const allImages = [produk.gambar, ...(produk.gambar_ke || [])].filter(Boolean);

  return (
    <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className="d-flex align-items-center gap-2 mb-4 small">
          <Link href="/" className="text-decoration-none text-muted">Beranda</Link>
          <span className="text-muted">/</span>
          <Link href="/produk" className="text-decoration-none text-muted">Produk</Link>
          <span className="text-muted">/</span>
          <span className="text-dark fw-medium">{produk.nama}</span>
        </nav>

        {/* Product Detail */}
        <div className="row g-4 mb-5">
          {/* Left: Images */}
          <div className="col-lg-6">
            {/* Main Image */}
            <div className="card-modern mb-3 overflow-hidden" style={{ height: '500px' }}>
              {selectedImage ? (
                <div className="position-relative w-100 h-100">
                  <Image src={selectedImage} alt={produk.nama} fill style={{ objectFit: "cover" }} />
                </div>
              ) : (
                <div className="w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: '#f5f5f5' }}>
                  <FaImage size={64} style={{ color: '#e0e0e0' }} />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="d-flex gap-2 overflow-auto">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    className="border-0 p-0 rounded overflow-hidden flex-shrink-0"
                    style={{
                      width: '80px',
                      height: '80px',
                      border: selectedImage === img ? '3px solid #e67e22' : '2px solid #e0e0e0',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image src={img} alt={`${produk.nama} - ${idx + 1}`} width={80} height={80} style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="col-lg-6">
            {/* Tier & Category */}
            <div className="d-flex align-items-center gap-2 mb-3">
              {getTierBadge(produk.mitraTier)}
              <span className="badge-modern" style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22' }}>
                {produk.kategori}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="fw-bold mb-3" style={{ fontSize: '32px', lineHeight: '1.3' }}>
              {produk.nama}
            </h1>

            {/* Rating */}
            {produkRating.count > 0 && (
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  {renderStars(produkRating.average, 18)}
                  <span className="fw-bold">{produkRating.average.toFixed(1)}</span>
                </div>
                <span className="text-muted">({produkRating.count} review)</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(230, 126, 34, 0.08)' }}>
              <span className="fw-bold fs-2" style={{ color: '#e67e22' }}>
                Rp{produk.harga.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Description */}
            <p className="text-muted mb-4" style={{ lineHeight: '1.8' }}>
              {produk.deskripsi}
            </p>

            {/* Availability & Details */}
            <div className="mb-4">
              {produk.tersedia ? (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <FaCheck style={{ color: '#27ae60' }} />
                  <span className="text-success fw-bold">Tersedia (Stok: {produk.stok || 0})</span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="text-danger fw-bold">Stok Habis</span>
                </div>
              )}

              {produk.porsi && (
                <div className="d-flex align-items-center gap-2 mb-2 text-muted">
                  <span>Porsi: {produk.porsi}</span>
                </div>
              )}
              {produk.berat && (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <span>Berat: {produk.berat} gram</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            {produk.tersedia && (
              <div className="mb-4">
                <label className="fw-medium mb-2">Jumlah:</label>
                <div className="d-flex align-items-center gap-3">
                  <button
                    className="btn btn-sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    -
                  </button>
                  <span className="fw-bold" style={{ fontSize: '20px', minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setQuantity(Math.min(produk.stok || 1, quantity + 1))}
                    disabled={quantity >= (produk.stok || 1)}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="d-flex gap-3 mb-4">
              {user?.role === 'customer' && (
                <button
                  className="btn flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleTambahKeranjang}
                  disabled={!produk.tersedia}
                  style={{
                    background: produk.tersedia ? '#e67e22' : '#e0e0e0',
                    color: produk.tersedia ? 'white' : '#95a5a6',
                    borderRadius: '12px',
                    padding: '14px 28px',
                    fontWeight: 700,
                    fontSize: '15px',
                    border: 'none'
                  }}
                >
                  <FaShoppingCart size={18} />
                  {quantity > 1 ? `Tambah ${quantity}x ke Keranjang` : 'Tambah ke Keranjang'}
                </button>
              )}
              <button
                className="btn d-flex align-items-center justify-content-center"
                style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none' }}
              >
                <FaHeart size={18} />
              </button>
              <button
                className="btn d-flex align-items-center justify-content-center"
                style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', border: 'none' }}
              >
                <FaShare size={18} />
              </button>
            </div>

            {user?.role === 'mitra' && (
              <div className="alert mb-4 border-0 text-center" style={{ background: 'rgba(52, 152, 219, 0.08)', borderRadius: '12px' }}>
                <small className="text-muted">Fitur keranjang hanya tersedia untuk Customer</small>
              </div>
            )}

            {!user && (
              <Link href="/login" className="btn w-100 d-flex align-items-center justify-content-center gap-2 mb-4" style={{ background: '#e67e22', color: 'white', borderRadius: '12px', padding: '14px 28px', fontWeight: 700, fontSize: '15px', border: 'none' }}>
                <FaShoppingCart size={18} />
                Login untuk Memesan
              </Link>
            )}

            {/* Mitra Info Card */}
            <div className="card-modern p-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaStore style={{ color: '#e67e22' }} />
                Tentang Mitra
              </h5>

              {mitraInfo ? (
                <>
                  <div className="d-flex align-items-start gap-3 mb-3">
                    {mitraInfo.profile_picture ? (
                      <div className="position-relative rounded-circle overflow-hidden flex-shrink-0" style={{ width: '60px', height: '60px' }}>
                        <Image src={mitraInfo.profile_picture} alt={mitraInfo.nama} fill style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '60px', height: '60px', background: '#e67e22', color: 'white' }}>
                        <span className="fw-bold fs-4">{mitraInfo.nama.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-bold">{mitraInfo.nama}</h6>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        {renderStars(mitraInfo.rating, 14)}
                        <span className="small text-muted">{mitraInfo.rating.toFixed(1)}</span>
                      </div>
                      {getTierBadge(mitraInfo.tier)}
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Total Produk</small>
                      <div className="fw-bold">{mitraInfo.totalProduk} produk</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Telepon</small>
                      <div className="fw-bold">{mitraInfo.telepon || 'Belum diisi'}</div>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block mb-1">Bergabung</small>
                      <div className="fw-bold">Sejak {mitraInfo.bergabung}</div>
                    </div>
                    {mitraInfo.alamat && (
                      <div className="col-12">
                        <small className="text-muted d-block mb-1">
                          <FaMapMarkerAlt className="me-1" /> Alamat
                        </small>
                        <div className="small">
                          {mitraInfo.alamat}
                          {(mitraInfo.kota || mitraInfo.provinsi) && (
                            <span className="text-muted">
                              {mitraInfo.kota && `, ${mitraInfo.kota}`}
                              {mitraInfo.provinsi && `, ${mitraInfo.provinsi}`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => router.push(`/chat?mitra_id=${mitraInfo.id}`)}
                    style={{ background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', borderRadius: '10px', padding: '12px', fontWeight: 600, border: 'none' }}
                  >
                    <FaStore size={14} /> Hubungi Mitra
                  </button>
                </>
              ) : (
                <div className="text-center text-muted py-3">
                  <p className="mb-0">Informasi mitra tidak tersedia</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="card-modern p-4 mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold mb-0">Review & Rating</h3>
            {user && !reviews.find(r => r.customer_id === user.id) && (
              <button
                className="btn btn-sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
                style={{ background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', borderRadius: '10px', padding: '8px 16px', fontWeight: 600, border: 'none' }}
              >
                Tulis Review
              </button>
            )}
          </div>

          {showReviewForm && user && (
            <div className="p-4 mb-4 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e0e0e0' }}>
              <form onSubmit={handleSubmitReview}>
                <div className="mb-3">
                  <label className="form-label fw-medium small">Rating</label>
                  <div className="d-flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar
                        key={star}
                        size={28}
                        style={{ color: star <= reviewForm.rating ? '#f39c12' : '#e0e0e0', cursor: "pointer" }}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      />
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-medium small">Komentar</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={reviewForm.komentar}
                    onChange={(e) => setReviewForm({ ...reviewForm, komentar: e.target.value })}
                    placeholder="Bagaimana pengalaman Anda dengan produk ini?"
                    required
                    style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn" style={{ background: '#e67e22', color: 'white', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, border: 'none' }}>
                    Kirim Review
                  </button>
                  <button type="button" className="btn" onClick={() => setShowReviewForm(false)} style={{ background: '#e0e0e0', color: '#2c3e50', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, border: 'none' }}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">Belum ada review untuk produk ini</p>
            </div>
          ) : (
            <>
              {/* Rating Summary */}
              <div className="d-flex align-items-center mb-4 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                <div className="me-4 text-center">
                  <h2 className="fw-bold mb-0">{produkRating.average.toFixed(1)}</h2>
                  <div className="d-flex mb-1">{renderStars(produkRating.average, 14)}</div>
                  <small className="text-muted">{produkRating.count} review</small>
                </div>
                <div className="flex-grow-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length;
                    const percentage = produkRating.count > 0 ? (count / produkRating.count) * 100 : 0;
                    return (
                      <div key={star} className="d-flex align-items-center mb-1">
                        <span className="me-2 small fw-medium">{star}</span>
                        <div className="progress flex-grow-1" style={{ height: '8px', borderRadius: '10px', background: '#e0e0e0' }}>
                          <div className="progress-bar" style={{ width: `${percentage}%`, background: '#e67e22', borderRadius: '10px' }} />
                        </div>
                        <span className="ms-2 small text-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              {reviews.map((review, index) => (
                <div key={review.id} className="mb-3 pb-3" style={{ borderBottom: index < reviews.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div className="d-flex align-items-start gap-3 mb-2">
                    {review.users?.profile_picture ? (
                      <div className="position-relative rounded-circle overflow-hidden flex-shrink-0" style={{ width: '45px', height: '45px' }}>
                        <Image src={review.users.profile_picture} alt={review.users.nama} fill style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '45px', height: '45px', background: '#e67e22', color: 'white' }}>
                        <span className="fw-bold">{(review.users?.nama || "C").charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong className="d-block mb-1">{review.users?.nama || "Customer"}</strong>
                          <div className="d-flex gap-1">{renderStars(review.rating, 14)}</div>
                        </div>
                        <small className="text-muted">
                          {new Date(review.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
                        </small>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted mb-0 ms-5">{review.komentar}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h3 className="fw-bold mb-4">Produk Terkait</h3>
            <div className="row g-4">
              {relatedProducts.map((p) => (
                <div key={p.id} className="col-md-6 col-lg-4 col-xl-3">
                  <KartuProduk produk={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
