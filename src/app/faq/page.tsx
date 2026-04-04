"use client";

import { useState } from "react";
import { FaQuestionCircle, FaShoppingCart, FaCreditCard, FaTruck, FaUndo, FaHandshake } from "react-icons/fa";

interface FAQ {
  id: string;
  kategori: "umum" | "pembayaran" | "pengiriman" | "pengembalian" | "mitra";
  pertanyaan: string;
  jawaban: string;
}

const faqList: FAQ[] = [
  {
    id: "faq-1",
    kategori: "umum",
    pertanyaan: "Bagaimana cara memesan makanan di Homebite?",
    jawaban:
      "Anda cukup menjelajahi katalog produk di halaman Produk, pilih makanan yang diinginkan, tambahkan ke keranjang, lalu lakukan checkout. Setelah pembayaran berhasil, pesanan Anda akan segera diproses oleh mitra UMKM.",
  },
  {
    id: "faq-2",
    kategori: "umum",
    pertanyaan: "Apakah saya perlu membuat akun untuk berbelanja?",
    jawaban:
      "Anda bisa menjelajahi produk tanpa akun, tetapi untuk melakukan pemesanan dan checkout, Anda perlu membuat akun terlebih dahulu. Pendaftaran gratis dan cepat.",
  },
  {
    id: "faq-3",
    kategori: "pembayaran",
    pertanyaan: "Metode pembayaran apa saja yang tersedia?",
    jawaban:
      "Homebite mendukung berbagai metode pembayaran: Transfer Bank (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, Dana, ShopeePay), Virtual Account, dan Kartu Kredit/Debit. Semua transaksi diproses secara aman.",
  },
  {
    id: "faq-4",
    kategori: "pembayaran",
    pertanyaan: "Apakah pembayaran saya aman?",
    jawaban:
      "Ya, keamanan pembayaran Anda adalah prioritas kami. Semua transaksi dienkripsi dan dana ditahan oleh sistem escrow hingga pesanan dikonfirmasi diterima oleh pembeli.",
  },
  {
    id: "faq-5",
    kategori: "pengiriman",
    pertanyaan: "Berapa lama waktu pengiriman?",
    jawaban:
      "Waktu pengiriman bervariasi tergantung lokasi. Untuk area yang sama dengan mitra, estimasi 1-2 hari kerja. Untuk luar kota, estimasi 2-5 hari kerja. Anda akan mendapatkan nomor resi untuk melacak pesanan.",
  },
  {
    id: "faq-6",
    kategori: "pengiriman",
    pertanyaan: "Apakah makanan dikemas dengan aman?",
    jawaban:
      "Tentu! Semua mitra wajib menggunakan kemasan food-grade yang sesuai standar. Produk seperti sambal dan saus dikemas vakum, sementara makanan berat menggunakan kemasan kedap udara untuk menjaga kesegaran.",
  },
  {
    id: "faq-7",
    kategori: "pengembalian",
    pertanyaan: "Bagaimana kebijakan pengembalian barang?",
    jawaban:
      "Jika produk yang diterima tidak sesuai deskripsi, rusak, atau kadaluarsa, Anda bisa mengajukan pengembalian dalam 1x24 jam setelah barang diterima. Sertakan foto bukti dan tim kami akan memproses refund.",
  },
  {
    id: "faq-8",
    kategori: "pengembalian",
    pertanyaan: "Kapan dana refund saya dikembalikan?",
    jawaban:
      "Setelah pengajuan pengembalian disetujui, dana akan dikembalikan dalam 3-7 hari kerja ke metode pembayaran awal Anda. Untuk e-wallet, proses biasanya lebih cepat (1-3 hari kerja).",
  },
  {
    id: "faq-9",
    kategori: "mitra",
    pertanyaan: "Bagaimana cara mendaftar sebagai mitra UMKM?",
    jawaban:
      "Kunjungi halaman 'Jadi Mitra', isi formulir pendaftaran dengan data usaha Anda, dan tim kami akan melakukan verifikasi dalam 2-3 hari kerja. Setelah disetujui, Anda bisa langsung mengunggah produk.",
  },
  {
    id: "faq-10",
    kategori: "mitra",
    pertanyaan: "Apa keuntungan menjadi mitra Homebite?",
    jawaban:
      "Mitra mendapatkan akses ke ribuan pelanggan, dashboard keuangan gratis, sistem tier (Silver/Gold/Platinum) yang memberi berbagai benefit, laporan penjualan otomatis, dan dukungan penuh dari tim Homebite untuk mengembangkan bisnis.",
  },
];

function getIconForKategori(kategori: FAQ["kategori"]) {
  switch (kategori) {
    case "umum":
      return <FaQuestionCircle className="me-2" style={{ color: "#e67e22" }} />;
    case "pembayaran":
      return <FaCreditCard className="me-2" style={{ color: "#e67e22" }} />;
    case "pengiriman":
      return <FaTruck className="me-2" style={{ color: "#e67e22" }} />;
    case "pengembalian":
      return <FaUndo className="me-2" style={{ color: "#e67e22" }} />;
    case "mitra":
      return <FaHandshake className="me-2" style={{ color: "#e67e22" }} />;
  }
}

export default function HalamanFAQ() {
  const [filterKategori, setFilterKategori] = useState<string>("semua");

  const faqDifilter =
    filterKategori === "semua"
      ? faqList
      : faqList.filter((faq) => faq.kategori === filterKategori);

  const kategoriList = [
    { value: "semua", label: "Semua" },
    { value: "umum", label: "Umum" },
    { value: "pembayaran", label: "Pembayaran" },
    { value: "pengiriman", label: "Pengiriman" },
    { value: "pengembalian", label: "Pengembalian" },
    { value: "mitra", label: "Mitra" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5 text-center" style={{ backgroundColor: "#e67e22" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">
            <FaQuestionCircle className="me-2" />
            Pusat Bantuan
          </h1>
          <p className="lead">Temukan jawaban untuk pertanyaan yang sering diajukan</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-5">
        <div className="container">
          {/* Filter Kategori */}
          <div className="mb-4">
            <label className="form-label fw-bold">Filter berdasarkan kategori:</label>
            <div className="d-flex flex-wrap gap-2">
              {kategoriList.map((kategori) => (
                <button
                  key={kategori.value}
                  className={`btn btn-sm ${
                    filterKategori === kategori.value ? "text-white" : "btn btn-outline-secondary"
                  }`}
                  style={filterKategori === kategori.value ? { backgroundColor: "#e67e22" } : {}}
                  onClick={() => setFilterKategori(kategori.value)}
                >
                  {kategori.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion FAQ */}
          <div className="accordion" id="faqAccordion">
            {faqDifilter.map((faq) => (
              <div className="accordion-item mb-3 border-0 shadow-sm" key={faq.id}>
                <h2 className="accordion-header" id={`heading-${faq.id}`}>
                  <button
                    className="accordion-button collapsed fw-bold"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse-${faq.id}`}
                    aria-expanded="false"
                    aria-controls={`collapse-${faq.id}`}
                    style={{ color: "#2c3e50" }}
                  >
                    {getIconForKategori(faq.kategori)}
                    {faq.pertanyaan}
                  </button>
                </h2>
                <div
                  id={`collapse-${faq.id}`}
                  className="accordion-collapse collapse"
                  aria-labelledby={`heading-${faq.id}`}
                  data-bs-parent="#faqAccordion"
                >
                  <div className="accordion-body text-muted">
                    {faq.jawaban}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {faqDifilter.length === 0 && (
            <div className="text-center py-5">
              <FaQuestionCircle size={48} className="text-muted mb-3" />
              <p className="text-muted">Tidak ada pertanyaan untuk kategori ini.</p>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-5 bg-light">
        <div className="container text-center">
          <h3 className="fw-bold mb-3">Masih Ada Pertanyaan?</h3>
          <p className="text-muted mb-4">
            Tim support kami siap membantu Anda. Jangan ragu untuk menghubungi kami.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <a href="mailto:support@homebite.id" className="btn text-white px-4" style={{ backgroundColor: "#e67e22" }}>
              Email Kami
            </a>
            <a href="https://wa.me/6281234567890" className="btn btn-outline-secondary px-4">
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
