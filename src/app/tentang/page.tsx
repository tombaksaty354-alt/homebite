"use client";

import Link from "next/link";
import { FaHeart, FaUsers, FaBullseye, FaStar, FaRocket, FaHandshake } from "react-icons/fa";

const anggotaTim = [
  {
    nama: "Andi Pratama",
    jabatan: "CEO & Pendiri",
    deskripsi: "Mantan chef yang ingin membantu UMKM makanan rumahan Go Digital.",
    foto: "https://picsum.photos/seed/andi/300/300",
  },
  {
    nama: "Siti Rahayu",
    jabatan: "CTO",
    deskripsi: "Engineer berpengalaman 10+ tahun membangun platform marketplace.",
    foto: "https://picsum.photos/seed/siti/300/300",
  },
  {
    nama: "Budi Setiawan",
    jabatan: "Head of Partnership",
    deskripsi: "Ahli relasi UMKM dengan jaringan luas di seluruh Indonesia.",
    foto: "https://picsum.photos/seed/budi/300/300",
  },
  {
    nama: "Diana Putri",
    jabatan: "Head of Marketing",
    deskripsi: "Spesialis digital marketing dengan passion di industri F&B.",
    foto: "https://picsum.photos/seed/diana/300/300",
  },
];

export default function HalamanTentang() {
  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5 text-center" style={{ backgroundColor: "#e67e22" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Tentang Homebite</h1>
          <p className="lead mx-auto" style={{ maxWidth: "700px" }}>
            Menghubungkan UMKM makanan rumahan dengan pecinta kuliner di seluruh Indonesia.
          </p>
        </div>
      </section>

      {/* Cerita Homebite */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <img
                src="https://picsum.photos/seed/homebite-story/600/400"
                alt="Cerita Homebite"
                className="img-fluid rounded shadow"
              />
            </div>
            <div className="col-lg-6">
              <h2 className="fw-bold mb-3">Cerita Kami</h2>
              <p className="text-muted">
                Homebite lahir dari kepedulian terhadap ribuan pelaku UMKM makanan rumahan yang kesulitan
                menjangkau pasar yang lebih luas. Banyak dari mereka memiliki resep turun-temurun dan cita rasa
                luar biasa, namun terbatas oleh akses teknologi dan pemasaran digital.
              </p>
              <p className="text-muted">
                Kami membangun platform yang tidak hanya menjadi tempat jualan, tapi juga membantu para UMKM
                mengelola keuangan, meningkatkan kualitas, dan membangun merek mereka. Setiap pesanan yang
                masuk bukan hanya transaksi, tapi juga cerita dan perjuangan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: "50px", height: "50px", backgroundColor: "#e67e22" }}
                    >
                      <FaBullseye className="text-white" size={24} />
                    </div>
                    <h3 className="fw-bold mb-0">Visi</h3>
                  </div>
                  <p className="text-muted mb-0">
                    Menjadi platform marketplace makanan rumahan terbesar dan terpercaya di Indonesia,
                    yang memberdayakan UMKM lokal untuk tumbuh dan bersaing di era digital.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: "50px", height: "50px", backgroundColor: "#2c3e50" }}
                    >
                      <FaRocket className="text-white" size={24} />
                    </div>
                    <h3 className="fw-bold mb-0">Misi</h3>
                  </div>
                  <ul className="text-muted mb-0">
                    <li className="mb-2">Memberdayakan UMKM makanan rumahan melalui teknologi</li>
                    <li className="mb-2">Menyediakan platform yang mudah digunakan dan terjangkau</li>
                    <li className="mb-2">Memastikan kualitas dan keamanan makanan terjamin</li>
                    <li className="mb-2">Membangun ekosistem kuliner rumahan yang berkelanjutan</li>
                    <li>Mendukung pelestarian resep tradisional Indonesia</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tim Homebite */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Tim Kami</h2>
            <p className="text-muted">Orang-orang berdedikasi di balik Homebite</p>
          </div>
          <div className="row">
            {anggotaTim.map((anggota) => (
              <div key={anggota.nama} className="col-md-6 col-lg-3 mb-4">
                <div className="card h-100 border-0 shadow-sm text-center">
                  <img
                    src={anggota.foto}
                    alt={anggota.nama}
                    className="card-img-top"
                    style={{ height: "250px", objectFit: "cover" }}
                  />
                  <div className="card-body">
                    <h5 className="fw-bold mb-1">{anggota.nama}</h5>
                    <p className="mb-2" style={{ color: "#e67e22", fontWeight: 600 }}>{anggota.jabatan}</p>
                    <p className="text-muted small mb-0">{anggota.deskripsi}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kenapa Homebite */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Kenapa Homebite?</h2>
            <p className="text-muted">Apa yang membuat kami berbeda</p>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaHeart size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Fokus Makanan Rumahan</h5>
                <p className="text-muted">
                  Satu-satunya marketplace yang khusus fokus pada makanan rumahan UMKM, bukan makanan pabrik.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaStar size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Kualitas Terjamin</h5>
                <p className="text-muted">
                  Sistem tier dan verifikasi memastikan hanya produk berkualitas yang sampai ke tangan Anda.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaHandshake size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Dukung UMKM Lokal</h5>
                <p className="text-muted">
                  Setiap pembelian langsung membantu perekonomian pelaku UMKM dan keluarga mereka.
                </p>
              </div>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaUsers size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Komunitas Kuliner</h5>
                <p className="text-muted">
                  Bergabung dengan komunitas pecinta kuliner rumahan yang aktif dan suportif.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaRocket size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Dashboard UMKM</h5>
                <p className="text-muted">
                  Tools keuangan dan laporan penjualan gratis untuk membantu mitra berkembang.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center p-4">
                <FaBullseye size={40} className="mb-3" style={{ color: "#e67e22" }} />
                <h5 className="fw-bold">Transparan & Aman</h5>
                <p className="text-muted">
                  Sistem pembayaran aman dengan jaminan uang kembali jika ada masalah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-5 text-white text-center" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container">
          <h2 className="fw-bold mb-3">Tertarik Bergabung?</h2>
          <p className="lead mb-4">
            Jadilah bagian dari gerakan mendukung UMKM makanan rumahan Indonesia.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link href="/produk" className="btn btn-lg text-white" style={{ backgroundColor: "#e67e22" }}>
              Jelajahi Makanan
            </Link>
            <Link href="/mitra" className="btn btn-lg btn-outline-light">
              Daftar Jadi Mitra
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
