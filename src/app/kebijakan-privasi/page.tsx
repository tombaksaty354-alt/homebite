import { FaShieldAlt, FaDatabase, FaEye, FaLock, FaUserShield, FaEnvelope, FaTrash } from "react-icons/fa";

export default function HalamanKebijakanPrivasi() {
  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5 text-center" style={{ backgroundColor: "#2c3e50" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">
            <FaShieldAlt className="me-2" />
            Kebijakan Privasi
          </h1>
          <p className="lead">Terakhir diperbarui: 1 Januari 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4 p-md-5">
                  <p className="text-muted mb-4">
                    Homebite (&ldquo;kami&rdquo;, &ldquo;kami&rdquo;, atau &ldquo;milik kami&rdquo;) berkomitmen
                    untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami
                    mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan platform
                    Homebite.
                  </p>

                  {/* 1. Pengumpulan Data */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaDatabase size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">1. Informasi yang Kami Kumpulkan</h3>
                    </div>
                    <p className="text-muted mb-3">
                      Kami mengumpulkan berbagai jenis informasi untuk menyediakan dan meningkatkan layanan:
                    </p>
                    <h6 className="fw-bold">a. Informasi yang Anda Berikan</h6>
                    <ul className="text-muted mb-3">
                      <li className="mb-1">Nama lengkap dan alamat email saat pendaftaran</li>
                      <li className="mb-1">Nomor telepon dan alamat pengiriman</li>
                      <li className="mb-1">Informasi pembayaran (diproses oleh pihak ketiga yang aman)</li>
                      <li className="mb-1">Data usaha untuk pendaftaran mitra UMKM</li>
                      <li className="mb-1">Konten yang Anda unggah (foto ulasan, feedback)</li>
                    </ul>
                    <h6 className="fw-bold">b. Informasi yang Dikumpulkan Secara Otomatis</h6>
                    <ul className="text-muted mb-3">
                      <li className="mb-1">Alamat IP dan jenis perangkat</li>
                      <li className="mb-1">Log aktivitas di platform (halaman yang dikunjungi, produk yang dilihat)</li>
                      <li className="mb-1">Cookie dan teknologi pelacakan serupa</li>
                      <li className="mb-1">Data lokasi (dengan izin Anda)</li>
                    </ul>
                  </section>

                  {/* 2. Penggunaan Data */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaEye size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">2. Bagaimana Kami Menggunakan Informasi Anda</h3>
                    </div>
                    <p className="text-muted mb-3">Informasi yang kami kumpulkan digunakan untuk:</p>
                    <ul className="text-muted">
                      <li className="mb-2">Memproses transaksi dan pengiriman pesanan</li>
                      <li className="mb-2">Mengelola akun dan memberikan dukungan pelanggan</li>
                      <li className="mb-2">Mengirimkan notifikasi terkait pesanan dan promosi</li>
                      <li className="mb-2">Meningkatkan pengalaman pengguna di platform</li>
                      <li className="mb-2">Menganalisis tren dan statistik penggunaan</li>
                      <li className="mb-2">Mendeteksi dan mencegah penipuan</li>
                      <li className="mb-2">Mematuhi kewajiban hukum dan peraturan yang berlaku</li>
                    </ul>
                  </section>

                  {/* 3. Perlindungan Data */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaLock size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">3. Perlindungan & Keamanan Data</h3>
                    </div>
                    <p className="text-muted mb-3">
                      Kami menerapkan langkah-langkah keamanan teknis dan organisasi untuk melindungi data
                      pribadi Anda:
                    </p>
                    <ul className="text-muted">
                      <li className="mb-2">Enkripsi SSL/TLS untuk semua transmisi data</li>
                      <li className="mb-2">Penyimpanan data di server yang aman dengan akses terbatas</li>
                      <li className="mb-2">Audit keamanan berkala dan pemantauan ancaman</li>
                      <li className="mb-2">Pelatihan keamanan data untuk seluruh karyawan</li>
                      <li className="mb-2">Sistem pembayaran yang mematuhi standar PCI DSS</li>
                    </ul>
                  </section>

                  {/* 4. Berbagi Data */}
                  <section className="mb-5">
                    <h3 className="fw-bold mb-3">4. Berbagi Informasi dengan Pihak Ketiga</h3>
                    <p className="text-muted mb-3">
                      Kami tidak menjual data pribadi Anda. Kami hanya membagikan informasi dengan:
                    </p>
                    <ul className="text-muted">
                      <li className="mb-2">
                        <strong>Mitra UMKM:</strong> Informasi nama dan alamat pengiriman untuk memproses
                        pesanan Anda.
                      </li>
                      <li className="mb-2">
                        <strong>Penyedia Layanan Pembayaran:</strong> Informasi yang diperlukan untuk
                        memproses transaksi secara aman.
                      </li>
                      <li className="mb-2">
                        <strong>Jasa Pengiriman:</strong> Data alamat dan kontak untuk pengiriman pesanan.
                      </li>
                      <li className="mb-2">
                        <strong>Pihak Berwenang:</strong> Jika diwajibkan oleh hukum atau untuk melindungi
                        hak dan keamanan kami.
                      </li>
                    </ul>
                  </section>

                  {/* 5. Hak Pengguna */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaUserShield size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">5. Hak Anda Sebagai Pengguna</h3>
                    </div>
                    <p className="text-muted mb-3">Anda memiliki hak-hak berikut terkait data pribadi Anda:</p>
                    <ul className="text-muted">
                      <li className="mb-2">
                        <strong>Hak Akses:</strong> Meminta salinan data pribadi yang kami simpan tentang Anda.
                      </li>
                      <li className="mb-2">
                        <strong>Hak Perbaikan:</strong> Meminta perbaikan data yang tidak akurat atau tidak lengkap.
                      </li>
                      <li className="mb-2">
                        <strong>Hak Penghapusan:</strong> Meminta penghapusan data pribadi Anda dari sistem kami.
                      </li>
                      <li className="mb-2">
                        <strong>Hak Pembatasan:</strong> Meminta pembatasan pemrosesan data pribadi Anda.
                      </li>
                      <li className="mb-2">
                        <strong>Hak Portabilitas:</strong> Menerima data Anda dalam format yang terstruktur dan
                        dapat dibaca mesin.
                      </li>
                      <li className="mb-2">
                        <strong>Hak Keberatan:</strong> Menolak pemrosesan data untuk tujuan pemasaran langsung.
                      </li>
                    </ul>
                    <p className="text-muted">
                      Untuk menggunakan hak-hak ini, silakan hubungi kami melalui email di{" "}
                      <strong>privasi@homebite.id</strong> atau melalui halaman profil Anda.
                    </p>
                  </section>

                  {/* 6. Cookie */}
                  <section className="mb-5">
                    <h3 className="fw-bold mb-3">6. Cookie & Teknologi Pelacakan</h3>
                    <p className="text-muted">
                      Kami menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman Anda.
                      Cookie membantu kami mengingat preferensi Anda, memahami penggunaan platform, dan
                      menyediakan fitur yang relevan. Anda dapat mengontrol cookie melalui pengaturan browser
                      Anda, namun menonaktifkan cookie dapat memengaruhi fungsionalitas platform.
                    </p>
                  </section>

                  {/* 7. Retensi Data */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaTrash size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">7. Retensi Data</h3>
                    </div>
                    <p className="text-muted">
                      Kami menyimpan data pribadi Anda selama akun Anda aktif atau selama diperlukan untuk
                      menyediakan layanan. Setelah akun dihapus, kami akan menghapus atau menganonimkan data
                      Anda dalam waktu 30 hari, kecuali ada kewajiban hukum yang mengharuskan penyimpanan
                      lebih lama (misalnya catatan transaksi untuk keperluan pajak).
                    </p>
                  </section>

                  {/* 8. Perubahan Kebijakan */}
                  <section className="mb-5">
                    <h3 className="fw-bold mb-3">8. Perubahan Kebijakan Privasi</h3>
                    <p className="text-muted">
                      Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material
                      akan diinformasikan melalui email atau notifikasi di platform. Kami mendorong Anda untuk
                      meninjau halaman ini secara berkala.
                    </p>
                  </section>

                  {/* 9. Kontak */}
                  <section>
                    <h3 className="fw-bold mb-3">9. Hubungi Kami</h3>
                    <p className="text-muted mb-3">
                      Jika Anda memiliki pertanyaan atau kekhawatiran mengenai Kebijakan Privasi ini, silakan
                      hubungi kami:
                    </p>
                    <div className="p-3 rounded" style={{ backgroundColor: "#f0f4f8" }}>
                      <div className="d-flex align-items-center mb-2">
                        <FaEnvelope className="me-2" style={{ color: "#2c3e50" }} />
                        <strong>Email:</strong>
                        <span className="ms-2">privasi@homebite.id</span>
                      </div>
                      <div className="d-flex align-items-center mb-2">
                        <FaShieldAlt className="me-2" style={{ color: "#2c3e50" }} />
                        <strong>Data Protection Officer:</strong>
                        <span className="ms-2">dpo@homebite.id</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaUserShield className="me-2" style={{ color: "#2c3e50" }} />
                        <strong>Alamat:</strong>
                        <span className="ms-2">Jakarta, Indonesia</span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
