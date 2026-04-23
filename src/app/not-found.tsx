"use client";

import Link from "next/link";
import { FaHome, FaSearch, FaUtensils } from "react-icons/fa";

export default function NotFound() {
  return (
    <section
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: "80vh",
        background: "linear-gradient(135deg, #fef9f4 0%, #fdf2e9 50%, #fff5eb 100%)",
      }}
    >
      <div className="container text-center py-5">
        {/* Animated food emoji */}
        <div
          className="mb-4"
          style={{
            fontSize: "120px",
            lineHeight: 1,
            animation: "bounce 2s ease infinite",
          }}
        >
          🍽️
        </div>

        {/* Error code */}
        <h1
          className="fw-bold mb-2"
          style={{
            fontSize: "clamp(4rem, 10vw, 8rem)",
            background: "linear-gradient(135deg, #e67e22, #f39c12)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-2px",
          }}
        >
          404
        </h1>

        {/* Message */}
        <h2 className="fw-bold mb-3" style={{ color: "#2c3e50", fontSize: "1.8rem" }}>
          Halaman Tidak Ditemukan
        </h2>
        <p
          className="text-muted mb-4 mx-auto"
          style={{ maxWidth: "450px", fontSize: "1.1rem", lineHeight: 1.6 }}
        >
          Maaf, halaman yang Anda cari tidak tersedia.
          Mungkin sudah dihapus atau alamatnya berubah.
        </p>

        {/* Action buttons */}
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Link
            href="/"
            className="btn d-flex align-items-center gap-2"
            style={{
              background: "#e67e22",
              color: "white",
              borderRadius: "12px",
              padding: "12px 28px",
              fontWeight: 600,
              fontSize: "15px",
              border: "none",
              boxShadow: "0 4px 15px rgba(230, 126, 34, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            <FaHome size={16} />
            Kembali ke Beranda
          </Link>

          <Link
            href="/produk"
            className="btn d-flex align-items-center gap-2"
            style={{
              background: "white",
              color: "#e67e22",
              borderRadius: "12px",
              padding: "12px 28px",
              fontWeight: 600,
              fontSize: "15px",
              border: "2px solid #e67e22",
              transition: "all 0.3s ease",
            }}
          >
            <FaUtensils size={16} />
            Jelajahi Produk
          </Link>
        </div>

        {/* Bounce animation */}
        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    </section>
  );
}
