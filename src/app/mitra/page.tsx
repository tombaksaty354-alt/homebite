"use client";

import Link from "next/link";
import { useState } from "react";
import { FaCheck, FaChartLine, FaShieldAlt, FaStar, FaMedal, FaInfoCircle, FaStore, FaWhatsapp } from "react-icons/fa";
import { BsShieldCheck } from "react-icons/bs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HalamanMitra() {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    telepon: "",
    nama_usaha: "",
    jenis_makanan: "",
    kota: "",
    deskripsi: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("calon_mitra_applications")
        .insert({
          nama: formData.nama,
          email: formData.email,
          telepon: formData.telepon,
          nama_usaha: formData.nama_usaha,
          jenis_makanan: formData.jenis_makanan,
          kota: formData.kota,
          deskripsi: formData.deskripsi,
          password: formData.password,
          status: "pending",
        });

      if (error) throw error;

      setMessage("success");
      setFormData({ nama: "", email: "", telepon: "", nama_usaha: "", jenis_makanan: "", kota: "", deskripsi: "", password: "", confirmPassword: "" });
    } catch (error: any) {
      setMessage("error");
      console.error("Error:", error);
    }
    setIsLoading(false);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5 text-center" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Jadi Mitra Homebite</h1>
          <p className="lead mb-4">
            Punya usaha makanan rumahan? Bergabunglah dengan kami dan dapatkan akses ke ribuan pelanggan.
            Tier mitra ditentukan otomatis berdasarkan performa penjualan Anda!
          </p>
          <a href="#daftar" className="btn btn-lg text-white" style={{ backgroundColor: "#e67e22" }}>
            Daftar Sekarang
          </a>
        </div>
      </section>

      {/* Info Komisi */}
      <section className="py-5 bg-warning">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <FaInfoCircle size={50} className="text-dark mb-3" />
              <h2 className="fw-bold mb-3">💰 Sistem Komisi Transparan</h2>
              <p className="fs-5 mb-0">
                Komisi akan <strong>ditagihkan setiap bulan</strong> dari setiap transaksi yang selesai/lunas.
                <br />
                <small className="text-muted">Tagihan akan muncul di halaman Tagihan setelah transaksi lunas</small>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Keuntungan */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Keuntungan Jadi Mitra</h2>
            <p className="text-muted">Lebih dari sekadar jualan online</p>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <FaChartLine size={50} className="mb-3" style={{ color: "#e67e22" }} />
                  <h4 className="fw-bold">Laporan Keuangan Otomatis</h4>
                  <p className="text-muted">
                    Setiap transaksi otomatis tercatat. Dashboard lengkap untuk pantau 
                    pemasukan, pengeluaran, dan laba bersih.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <FaShieldAlt size={50} className="mb-3" style={{ color: "#e67e22" }} />
                  <h4 className="fw-bold">Tier Naik Otomatis</h4>
                  <p className="text-muted">
                    Semakin banyak penjualan & rating bagus, tier Anda naik otomatis.
                    Tidak perlu daftar ulang!
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body text-center">
                  <FaStar size={50} className="mb-3" style={{ color: "#e67e22" }} />
                  <h4 className="fw-bold">Akses ke Ribuan Pelanggan</h4>
                  <p className="text-muted">
                    Marketplace kami menghubungkan Anda dengan konsumen yang mencari 
                    makanan rumahan berkualitas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sistem Tier */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Sistem Tier Otomatis</h2>
            <p className="text-muted">Tier ditentukan berdasarkan performa penjualan & rating</p>
          </div>
          <div className="row text-center">
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <BsShieldCheck size={50} className="text-secondary mb-3" />
                  <h4 className="fw-bold">Silver</h4>
                  <p className="text-muted">Tier awal untuk semua mitra baru</p>
                  <small className="text-muted">0 transaksi</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow border-warning" style={{ borderWidth: "3px" }}>
                <div className="card-body">
                  <BsShieldCheck size={50} className="text-warning mb-3" />
                  <h4 className="fw-bold">Gold</h4>
                  <p className="text-muted">Naik otomatis saat capai target</p>
                  <small className="text-muted">50 transaksi + rating ≥ 4.5</small>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100 shadow text-white" style={{ backgroundColor: "#2c3e50" }}>
                <div className="card-body">
                  <BsShieldCheck size={50} className="text-warning mb-3" />
                  <h4 className="fw-bold">Platinum</h4>
                  <p className="text-light">Tier tertinggi untuk mitra terbaik</p>
                  <small>200 transaksi + rating ≥ 4.8</small>
                </div>
              </div>
            </div>
          </div>
          <div className="alert alert-info text-center mt-3">
            <FaInfoCircle className="me-2" />
            <strong>Komisi Platform:</strong> Komisi ditagihkan setiap bulan dari setiap transaksi yang selesai/lunas
          </div>
        </div>
      </section>

      {/* Syarat Pendaftaran */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="fw-bold mb-4">Syarat Jadi Mitra Homebite</h2>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex align-items-start">
                  <FaCheck className="text-success me-3 mt-1" />
                  <div>
                    <strong>Memiliki usaha makanan rumahan</strong>
                    <p className="text-muted mb-0">Minimal 1 bulan beroperasi</p>
                  </div>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <FaCheck className="text-success me-3 mt-1" />
                  <div>
                    <strong>Produk berkualitas & konsisten</strong>
                    <p className="text-muted mb-0">Lolos proses kurasi tim Homebite</p>
                  </div>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <FaCheck className="text-success me-3 mt-1" />
                  <div>
                    <strong>KTP & dokumen usaha</strong>
                    <p className="text-muted mb-0">Untuk verifikasi identitas</p>
                  </div>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <FaCheck className="text-success me-3 mt-1" />
                  <div>
                    <strong>Setuju dengan sistem komisi</strong>
                    <p className="text-muted mb-0">Rp500 per produk terjual untuk biaya platform</p>
                  </div>
                </li>
              </ul>
              <div className="mt-4 p-3 bg-white rounded shadow-sm">
                <h5 className="fw-bold">Butuh Bantuan?</h5>
                <p className="mb-2 text-muted">Hubungi kami untuk konsultasi mitra:</p>
                <a href="https://wa.me/6281234567890" className="btn btn-success">
                  <FaWhatsapp className="me-2" /> Chat WhatsApp
                </a>
              </div>
            </div>
            <div className="col-lg-6" id="daftar">
              <div className="card shadow">
                <div className="card-body">
                  <h3 className="fw-bold mb-4">Formulir Pendaftaran Mitra</h3>
                  
                  {message === "success" && (
                    <div className="alert alert-success">
                      <FaCheck className="me-2" />
                      Pendaftaran berhasil! Tim kami akan meninjau dan mengaktifkan akun Anda.
                      <br />
                      <small>Anda bisa login menggunakan Email & Password yang sudah didaftarkan.</small>
                    </div>
                  )}
                  {message === "error" && (
                    <div className="alert alert-danger">
                      Terjadi kesalahan. Silakan coba lagi.
                    </div>
                  )}
                  {error && (
                    <div className="alert alert-danger">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Nama Lengkap</label>
                      <input type="text" className="form-control" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">No. Telepon</label>
                      <input type="tel" className="form-control" value={formData.telepon} onChange={(e) => setFormData({...formData, telepon: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Nama Usaha</label>
                      <input type="text" className="form-control" value={formData.nama_usaha} onChange={(e) => setFormData({...formData, nama_usaha: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Jenis Makanan</label>
                      <input type="text" className="form-control" placeholder="Contoh: Rendang, Sambal, Kue" value={formData.jenis_makanan} onChange={(e) => setFormData({...formData, jenis_makanan: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Kota</label>
                      <input type="text" className="form-control" value={formData.kota} onChange={(e) => setFormData({...formData, kota: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Deskripsi Usaha</label>
                      <textarea className="form-control" rows={3} value={formData.deskripsi} onChange={(e) => setFormData({...formData, deskripsi: e.target.value})} required></textarea>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Password Akun</label>
                        <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Minimal 6 karakter" required />
                        <small className="text-muted">Password ini akan digunakan untuk login setelah disetujui</small>
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold">Konfirmasi Password</label>
                        <input type="password" className="form-control" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Ulangi password" required />
                      </div>
                    </div>
                    <div className="form-check mb-3">
                      <input className="form-check-input" type="checkbox" required />
                      <label className="form-check-label">
                        Saya setuju dengan komisi yang <strong>ditagihkan setiap bulan dari transaksi yang selesai/lunas</strong>
                      </label>
                    </div>
                    <button type="submit" className="btn w-100 text-white" disabled={isLoading} style={{ backgroundColor: "#e67e22" }}>
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Mengirim...
                        </>
                      ) : (
                        "Kirim Pendaftaran Mitra"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
