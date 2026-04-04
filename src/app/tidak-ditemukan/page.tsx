import Link from "next/link";
import { FaHome, FaSearch, FaExclamationTriangle } from "react-icons/fa";

export default function HalamanTidakDitemukan() {
  return (
    <section className="py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            {/* Illustration */}
            <div className="mb-4">
              <div
                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{
                  width: "200px",
                  height: "200px",
                  backgroundColor: "#fff3e0",
                }}
              >
                <div className="text-center">
                  <FaExclamationTriangle size={64} style={{ color: "#e67e22" }} />
                  <div
                    className="fw-bold mt-2"
                    style={{ fontSize: "3rem", color: "#e67e22", lineHeight: 1 }}
                  >
                    404
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <h1 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
              Ups! Halaman Tidak Ditemukan
            </h1>
            <p className="lead text-muted mb-2">
              Sepertinya Anda tersesat di dapur orang...
            </p>
            <p className="text-muted mb-4">
              Halaman yang Anda cari tidak ada atau mungkin sudah dipindahkan. Jangan khawatir, masih banyak
              makanan lezat yang menunggu Anda di Homebite!
            </p>

            {/* Fun Illustration Message */}
            <div
              className="p-4 rounded-3 mb-4 mx-auto"
              style={{ maxWidth: "500px", backgroundColor: "#fff8f0" }}
            >
              <p className="mb-0" style={{ fontSize: "1.1rem" }}>
                &ldquo;Seperti mencari resep di buku tanpa halaman yang tepat,
                <br />
                halaman ini memang tidak ada. Tapi jangan sedih,
                <br />
                masih banyak kuliner enak yang bisa kamu temukan!&rdquo;
              </p>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <Link href="/" className="btn btn-lg text-white px-4" style={{ backgroundColor: "#e67e22" }}>
                <FaHome className="me-2" />
                Kembali ke Beranda
              </Link>
              <Link href="/produk" className="btn btn-lg btn-outline-secondary px-4">
                <FaSearch className="me-2" />
                Jelajahi Produk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
