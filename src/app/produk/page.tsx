"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import KartuProduk from "@/components/KartuProduk";
import { supabase } from "@/context/AuthContext";
import { FaSearch, FaFilter, FaTimes } from "react-icons/fa";
import { BsGrid3X3 } from "react-icons/bs";

function ProdukContent() {
  const searchParams = useSearchParams();
  const [produkData, setProdukData] = useState<any[]>([]);
  const [kategoriList, setKategoriList] = useState<string[]>(["Semua"]);
  const [kategoriDipilih, setKategoriDipilih] = useState<string>("Semua");
  const [urutkanBerdasarkan, setUrutkanBerdasarkan] = useState<string>("nama");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchQuery(query);
    fetchProduk(query);
  }, [searchParams]);

  async function fetchProduk(search: string = "") {
    setLoading(true);
    if (!supabase) return;

    let query = supabase.from("produk").select("*").eq("tersedia", true);

    if (search) {
      query = query.or(`nama.ilike.%${search}%,deskripsi.ilike.%${search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (!error && data) {
      setProdukData(data);
      const kategori = ["Semua", ...new Set(data.map((p: any) => p.kategori))];
      setKategoriList(kategori as string[]);
    }
    setLoading(false);
  }

  let produkDifilter =
    kategoriDipilih === "Semua"
      ? [...produkData]
      : produkData.filter((produk) => produk.kategori === kategoriDipilih);

  // Urutkan produk
  produkDifilter.sort((a, b) => {
    if (urutkanBerdasarkan === "nama") return a.nama.localeCompare(b.nama);
    if (urutkanBerdasarkan === "harga-rendah") return a.harga - b.harga;
    if (urutkanBerdasarkan === "harga-tinggi") return b.harga - a.harga;
    if (urutkanBerdasarkan === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  if (loading) {
    return (
      <section className="py-5">
        <div className="container">
          <div className="row g-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="col-md-6 col-lg-4 col-xl-3">
                <div 
                  className="card-modern"
                  style={{ height: '400px' }}
                >
                  <div className="skeleton w-100" style={{ height: '220px' }} />
                  <div className="p-3">
                    <div className="skeleton mb-2" style={{ height: '12px', width: '60%' }} />
                    <div className="skeleton mb-2" style={{ height: '18px', width: '90%' }} />
                    <div className="skeleton mb-2" style={{ height: '14px', width: '50%' }} />
                    <div className="skeleton mt-3" style={{ height: '24px', width: '70%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header Section */}
        <div 
          className="text-center mb-5"
          style={{ animation: 'fadeInDown 0.6s ease-out' }}
        >
          <span 
            className="badge-modern mb-3 d-inline-block"
            style={{ 
              background: 'rgba(230, 126, 34, 0.1)',
              color: '#e67e22'
            }}
          >
            Jelajahi Produk
          </span>
          <h1 className="fw-bold mb-2 display-5">Semua Makanan Rumahan</h1>
          <p className="text-muted mb-0">Temukan kuliner lezat dari UMKM lokal terpercaya</p>
          
          {produkData.length > 0 && (
            <div 
              className="mt-3 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
              style={{ 
                background: 'white',
                border: '1px solid #e0e0e0',
                fontSize: '14px'
              }}
            >
              <span className="text-muted">Menampilkan</span>
              <strong style={{ color: '#e67e22' }}>{produkDifilter.length}</strong>
              <span className="text-muted">produk</span>
            </div>
          )}
        </div>

        {/* Search Result Alert */}
        {searchQuery.trim() && (
          <div 
            className="alert mb-4 border-0 d-flex align-items-center gap-3"
            style={{ 
              background: 'rgba(230, 126, 34, 0.08)',
              borderRadius: '12px',
              animation: 'fadeInDown 0.6s ease-out'
            }}
          >
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: '45px',
                height: '45px',
                background: 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)'
              }}
            >
              <FaSearch style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <div className="flex-grow-1">
              <strong style={{ color: '#2c3e50', fontSize: '15px' }}>
                Hasil pencarian untuk &ldquo;{searchQuery}&rdquo;
              </strong>
              <p className="mb-0 text-muted small">Ditemukan {produkDifilter.length} produk</p>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => window.location.href = '/produk'}
              style={{
                background: 'rgba(230, 126, 34, 0.15)',
                color: '#e67e22',
                borderRadius: '8px',
                padding: '6px 12px'
              }}
            >
              <FaTimes size={14} />
            </button>
          </div>
        )}

        {/* Filter Section */}
        <div 
          className="card-modern mb-4 p-4"
          style={{ 
            border: 'none',
            animation: 'fadeInUp 0.6s ease-out'
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <FaFilter style={{ color: '#e67e22', fontSize: '18px' }} />
              Filter & Kategori
            </h5>
            <button
              className="btn btn-sm d-lg-none"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                background: 'rgba(230, 126, 34, 0.1)',
                color: '#e67e22',
                borderRadius: '8px',
                padding: '6px 12px'
              }}
            >
              {showFilters ? <FaTimes /> : <FaFilter />}
            </button>
          </div>

          <div className={showFilters ? 'd-block' : 'd-none d-lg-block'}>
            <div className="row g-3">
              {/* Kategori */}
              <div className="col-lg-6">
                <label className="form-label fw-medium mb-2 small text-uppercase" style={{ letterSpacing: '0.5px', color: '#95a5a6' }}>
                  Kategori
                </label>
                <div className="d-flex flex-wrap gap-2">
                  {kategoriList.map((kategori, index) => (
                    <button
                      key={kategori}
                      className={`btn btn-sm px-3 py-2`}
                      style={{
                        background: kategoriDipilih === kategori 
                          ? 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)' 
                          : 'rgba(230, 126, 34, 0.08)',
                        color: kategoriDipilih === kategori ? 'white' : '#e67e22',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '13px',
                        transition: 'all 0.3s ease',
                        border: 'none',
                        animation: `scaleIn 0.3s ease-out ${index * 0.05}s both`
                      }}
                      onClick={() => setKategoriDipilih(kategori)}
                    >
                      {kategori}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urutkan */}
              <div className="col-lg-6">
                <label className="form-label fw-medium mb-2 small text-uppercase" style={{ letterSpacing: '0.5px', color: '#95a5a6' }}>
                  Urutkan Berdasarkan
                </label>
                <select
                  className="form-select"
                  value={urutkanBerdasarkan}
                  onChange={(e) => setUrutkanBerdasarkan(e.target.value)}
                  style={{
                    borderRadius: '10px',
                    border: '2px solid #e0e0e0',
                    padding: '10px 16px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#e67e22';
                    e.target.style.boxShadow = '0 0 0 4px rgba(230, 126, 34, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="nama">Nama (A-Z)</option>
                  <option value="harga-rendah">Harga: Rendah ke Tinggi</option>
                  <option value="harga-tinggi">Harga: Tinggi ke Rendah</option>
                  <option value="rating">Rating Tertinggi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {produkDifilter.length > 0 ? (
          <div className="row g-4">
            {produkDifilter.map((produk, index) => (
              <div 
                key={produk.id} 
                className="col-md-6 col-lg-4 col-xl-3"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`
                }}
              >
                <KartuProduk produk={produk} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div 
            className="text-center py-5"
            style={{ animation: 'fadeIn 0.6s ease-out' }}
          >
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
              style={{
                width: '100px',
                height: '100px',
                background: 'rgba(230, 126, 34, 0.08)'
              }}
            >
              <FaSearch size={48} style={{ color: '#e67e22', opacity: 0.5 }} />
            </div>
            <h4 className="fw-bold mb-2 text-muted">Tidak ada produk ditemukan</h4>
            <p className="text-muted mb-4">Coba ubah kata kunci atau kategori pencarian Anda.</p>
            <button
              className="btn"
              onClick={() => {
                setKategoriDipilih('Semua');
                setSearchQuery('');
              }}
              style={{
                background: 'linear-gradient(135deg, #e67e22 0%, #f39c12 100%)',
                color: 'white',
                borderRadius: '10px',
                padding: '12px 28px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(230, 126, 34, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function HalamanProduk() {
  return (
    <Suspense fallback={
      <section className="py-5">
        <div className="container text-center">
          <div 
            className="spinner-border mx-auto"
            style={{ 
              color: '#e67e22',
              width: '3rem',
              height: '3rem'
            }}
            role="status"
          >
            <span className="visually-hidden">Memuat...</span>
          </div>
          <p className="mt-3 text-muted">Memuat produk...</p>
        </div>
      </section>
    }>
      <ProdukContent />
    </Suspense>
  );
}
