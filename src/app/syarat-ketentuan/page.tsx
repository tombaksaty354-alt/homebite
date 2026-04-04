import { FaFileContract, FaGavel, FaStore, FaShieldAlt, FaEnvelope } from "react-icons/fa";

export default function HalamanSyaratKetentuan() {
  return (
    <>
      {/* Hero Section */}
      <section className="text-white py-5 text-center" style={{ backgroundColor: "#e67e22" }}>
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">
            <FaFileContract className="me-2" />
            Syarat & Ketentuan
          </h1>
          <p className="lead">Berlaku efektif sejak 1 Januari 2026</p>
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
                    Selamat datang di Homebite. Dengan mengakses dan menggunakan platform kami, Anda menyetujui
                    syarat dan ketentuan berikut. Harap baca dengan seksama.
                  </p>

                  {/* 1. Penggunaan Layanan */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaGavel size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">1. Penggunaan Layanan</h3>
                    </div>
                    <ol className="text-muted">
                      <li className="mb-2">
                        Homebite adalah platform marketplace yang menghubungkan penjual (UMKM) dengan pembeli
                        untuk transaksi makanan rumahan.
                      </li>
                      <li className="mb-2">
                        Pengguna wajib berusia minimal 17 tahun atau memiliki izin dari orang tua/wali untuk
                        menggunakan layanan ini.
                      </li>
                      <li className="mb-2">
                        Pengguna bertanggung jawab atas kerahasiaan informasi akun dan semua aktivitas yang
                        terjadi di bawah akun mereka.
                      </li>
                      <li className="mb-2">
                        Dilarang menggunakan platform untuk aktivitas ilegal, penipuan, atau tindakan yang
                        merugikan pihak lain.
                      </li>
                      <li className="mb-2">
                        Homebite berhak menangguhkan atau menutup akun yang melanggar ketentuan ini tanpa
                        pemberitahuan sebelumnya.
                      </li>
                    </ol>
                  </section>

                  {/* 2. Transaksi */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaFileContract size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">2. Transaksi</h3>
                    </div>
                    <ol className="text-muted" start={1}>
                      <li className="mb-2">
                        Semua harga yang tertera di platform sudah dalam Rupiah (IDR) dan belum termasuk
                        biaya pengiriman.
                      </li>
                      <li className="mb-2">
                        Pembayaran diproses melalui sistem escrow. Dana akan diteruskan ke penjual setelah
                        pembeli mengkonfirmasi penerimaan barang.
                      </li>
                      <li className="mb-2">
                        Pembeli wajib memeriksa produk yang diterima dan melaporkan kendala dalam 1x24 jam.
                      </li>
                      <li className="mb-2">
                        Pembatalan pesanan hanya dapat dilakukan sebelum pesanan diproses oleh penjual.
                      </li>
                      <li className="mb-2">
                        Refund akan diproses sesuai kebijakan pengembalian yang berlaku dan memerlukan bukti
                        yang valid.
                      </li>
                    </ol>
                  </section>

                  {/* 3. Mitra UMKM */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaStore size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">3. Mitra UMKM</h3>
                    </div>
                    <ol className="text-muted" start={1}>
                      <li className="mb-2">
                        Mitra UMKM wajib menyediakan informasi usaha yang akurat dan valid saat pendaftaran.
                      </li>
                      <li className="mb-2">
                        Produk yang dijual harus memenuhi standar keamanan pangan dan tidak melanggar
                        peraturan yang berlaku.
                      </li>
                      <li className="mb-2">
                        Mitra menyetujui komisi yang dikenakan oleh Homebite sesuai dengan tier yang berlaku
                        (Silver: 10%, Gold: 8%, Platinum: 5%).
                      </li>
                      <li className="mb-2">
                        Mitra bertanggung jawab atas keakuratan deskripsi produk, foto, harga, dan
                        ketersediaan stok.
                      </li>
                      <li className="mb-2">
                        Mitra wajib memproses pesanan dalam waktu maksimal 1x24 jam setelah pembayaran
                        dikonfirmasi.
                      </li>
                      <li className="mb-2">
                        Homebite berhak menurunkan tier atau memutus kemitraan jika mitra tidak memenuhi
                        standar kualitas yang ditetapkan.
                      </li>
                    </ol>
                  </section>

                  {/* 4. Kebijakan Privasi */}
                  <section className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <FaShieldAlt size={24} className="me-2" style={{ color: "#e67e22" }} />
                      <h3 className="fw-bold mb-0">4. Kebijakan Privasi</h3>
                    </div>
                    <ol className="text-muted" start={1}>
                      <li className="mb-2">
                        Informasi pribadi pengguna dikumpulkan dan digunakan sesuai dengan Kebijakan Privasi
                        kami.
                      </li>
                      <li className="mb-2">
                        Data transaksi disimpan untuk keperluan pencatatan, laporan, dan penyelesaian
                        sengketa.
                      </li>
                      <li className="mb-2">
                        Homebite tidak akan menjual atau membagikan data pribadi pengguna kepada pihak ketiga
                        tanpa persetujuan, kecuali diwajibkan oleh hukum.
                      </li>
                      <li className="mb-2">
                        Pengguna berhak mengakses, memperbarui, atau menghapus data pribadi mereka melalui
                        halaman profil.
                      </li>
                    </ol>
                  </section>

                  {/* 5. Perubahan Syarat & Ketentuan */}
                  <section className="mb-5">
                    <h3 className="fw-bold mb-3">5. Perubahan Syarat & Ketentuan</h3>
                    <p className="text-muted">
                      Homebite berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan
                      diinformasikan melalui email atau notifikasi di platform. Penggunaan layanan setelah
                      perubahan berlaku berarti Anda menyetujui perubahan tersebut.
                    </p>
                  </section>

                  {/* 6. Kontak */}
                  <section>
                    <h3 className="fw-bold mb-3">6. Kontak</h3>
                    <p className="text-muted">
                      Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami:
                    </p>
                    <div className="p-3 rounded" style={{ backgroundColor: "#fff8f0" }}>
                      <div className="d-flex align-items-center mb-2">
                        <FaEnvelope className="me-2" style={{ color: "#e67e22" }} />
                        <strong>Email:</strong>
                        <span className="ms-2">legal@homebite.id</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <FaStore className="me-2" style={{ color: "#e67e22" }} />
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
