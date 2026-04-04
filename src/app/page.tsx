"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import { FaShippingFast, FaShieldAlt, FaChartLine, FaAward, FaArrowRight, FaInfoCircle } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";

export default function Beranda() {
  const [produkUnggulan, setProdukUnggulan] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/produk")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProdukUnggulan(data.produk.slice(0, 4));
        }
      })
      .catch(err => console.error("Error fetch produk:", err));
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5" style={{ backgroundColor: "#e67e22" }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                🍽️ Homebite
              </h1>
              <p className="lead mb-4">
                Marketplace khusus <strong>makanan rumahan</strong> yang menghubungkan UMKM lokal dengan pecinta kuliner.
                Dukung pengusaha lokal sambil menikmati makanan lezat!
              </p>
              <div className="d-flex gap-3">
                <Link href="/produk" className="btn btn-light btn-lg">
                  Jelajahi Makanan
                </Link>
                <Link href="/mitra" className="btn btn-outline-light btn-lg">
                  Jadi Mitra
                </Link>
              </div>
            </div>
            <div className="col-lg-6 text-center mt-4 mt-lg-0">
              <img
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop"
                alt="Makanan Rumahan"
                className="img-fluid rounded shadow"
                style={{ maxHeight: "400px", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Homebite */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Kenapa Pilih Homebite?</h2>
            <p className="text-muted">Platform yang peduli sama UMKM dan konsumen</p>
          </div>
          <div className="row text-center">
            <div className="col-md-3 mb-4">
              <div className="p-4">
                <FaShippingFast className="mb-3" size={40} style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Pengiriman Cepat</h5>
                <p className="text-muted mb-0">Makanan sampai segar & aman</p>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="p-4">
                <FaShieldAlt className="mb-3" size={40} style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">UMKM Terverifikasi</h5>
                <p className="text-muted mb-0">Semua mitra melalui proses kurasi</p>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="p-4">
                <FaChartLine className="mb-3" size={40} style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Laporan Keuangan</h5>
                <p className="text-muted mb-0">Otomatis untuk mitra UMKM</p>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="p-4">
                <FaAward className="mb-3" size={40} style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Sistem Tier</h5>
                <p className="text-muted mb-0">Silver, Gold, Platinum</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sistem Tier Otomatis */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <span
              className="badge-modern mb-3 d-inline-block"
              style={{ background: "rgba(230, 126, 34, 0.1)", color: "#e67e22" }}
            >
              Sistem Tier
            </span>
            <h2 className="fw-bold mb-3">Sistem Tier Otomatis</h2>
            <p className="text-muted">Tier ditentukan berdasarkan performa penjualan & rating</p>
          </div>

          <div className="row g-4">
            {[
              {
                tier: "Silver",
                icon: BsShieldCheck,
                color: "#95a5a6",
                bgColor: "rgba(149, 165, 166, 0.1)",
                desc: "Tier awal untuk semua mitra baru",
                req: "0 transaksi"
              },
              {
                tier: "Gold",
                icon: BsShieldCheck,
                color: "#f39c12",
                bgColor: "rgba(243, 156, 18, 0.1)",
                desc: "Naik otomatis saat capai target",
                req: "50 transaksi + rating ≥ 4.5"
              },
              {
                tier: "Platinum",
                icon: BsShieldCheck,
                color: "#2c3e50",
                bgColor: "rgba(44, 62, 80, 0.1)",
                desc: "Tier tertinggi untuk mitra terbaik",
                req: "200 transaksi + rating ≥ 4.8"
              }
            ].map((item, index) => (
              <div key={index} className="col-md-4">
                <div
                  className="card-modern h-100 p-4 text-center position-relative"
                  style={{ border: item.tier === "Gold" ? "2px solid #f39c12" : "none" }}
                >
                  {item.tier === "Gold" && (
                    <div
                      className="position-absolute top-0 start-50 translate-middle badge-modern"
                      style={{ background: "#f39c12", color: "white", fontSize: "10px" }}
                    >
                      POPULER
                    </div>
                  )}

                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: "80px", height: "80px", background: item.bgColor }}
                  >
                    <item.icon size={40} style={{ color: item.color }} />
                  </div>

                  <h4 className="fw-bold mb-2" style={{ color: item.color }}>{item.tier}</h4>
                  <p className="text-muted mb-3 small">{item.desc}</p>

                  <div className="rounded-3 p-2" style={{ background: "#f8f9fa" }}>
                    <small className="text-muted fw-medium">{item.req}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="alert mt-4 border-0" style={{ background: "rgba(52, 152, 219, 0.08)", borderRadius: "12px" }}>
            <div className="d-flex align-items-center gap-2">
              <FaInfoCircle style={{ color: "#3498db", fontSize: "20px" }} />
              <div>
                <strong style={{ color: "#2c3e50" }}>Komisi Platform:</strong>
                <span className="text-muted ms-1">Komisi dipotong Rp500 per pesanan yang selesai</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Produk Unggulan */}
      <section className="py-5" style={{ background: "#fafafa" }}>
        <div className="container">
          <div className="text-center mb-5">
            <span
              className="badge-modern mb-3 d-inline-block"
              style={{ background: "rgba(230, 126, 34, 0.1)", color: "#e67e22" }}
            >
              Produk Terlaris
            </span>
            <h2 className="fw-bold mb-3">Makanan Rumahan Terlaris</h2>
            <p className="text-muted mb-0">Dari UMKM mitra terpercaya kami</p>
          </div>

          <div className="row g-4">
            {produkUnggulan.map((produk) => (
              <div key={produk.id} className="col-md-6 col-lg-3">
                <KartuProduk produk={produk} />
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link
              href="/produk"
              className="btn btn-lg d-inline-flex align-items-center gap-2"
              style={{ background: "#e67e22", color: "white", borderRadius: "12px", padding: "14px 32px", fontWeight: 700, border: "none" }}
            >
              Lihat Semua Makanan
              <FaArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Daftar Mitra */}
      <section className="py-5 text-white" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container text-center">
          <span
            className="badge-modern mb-3 d-inline-block"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
          >
            Bergabung Sekarang
          </span>
          <h2 className="fw-bold mb-3 display-5">Punya Usaha Makanan Rumahan?</h2>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: "700px" }}>
            Gabung jadi mitra Homebite dan dapatkan akses ke ribuan pelanggan + dashboard keuangan gratis!
          </p>
          <Link
            href="/mitra"
            className="btn btn-lg d-inline-flex align-items-center gap-2"
            style={{ background: "white", color: "#2c3e50", borderRadius: "12px", padding: "16px 40px", fontWeight: 700, border: "none" }}
          >
            Daftar Jadi Mitra Sekarang
            <FaArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
