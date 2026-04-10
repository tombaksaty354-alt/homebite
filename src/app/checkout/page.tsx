"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, supabase } from "@/context/AuthContext";
import { useKeranjang } from "@/context/KeranjangContext";
import { FaShoppingCart, FaArrowRight, FaMapMarkerAlt, FaExclamationCircle, FaPlus, FaCheckCircle, FaImage, FaLock, FaShieldAlt } from "react-icons/fa";
import Image from "next/image";

interface Alamat {
  id: string;
  label: string;
  alamat: string;
  kota: string;
  provinsi: string;
  kode_pos: string;
  telepon: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { keranjang, getTotalKeranjang, kosongkanKeranjang } = useKeranjang();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Alamat states
  const [alamatList, setAlamatList] = useState<Alamat[]>([]);
  const [selectedAlamatId, setSelectedAlamatId] = useState<string>("");
  const [showAlamatForm, setShowAlamatForm] = useState(false);
  const [newAlamat, setNewAlamat] = useState({
    label: "",
    alamat: "",
    kota: "",
    provinsi: "",
    kode_pos: "",
    telepon: "",
  });

  useEffect(() => {
    if (loading) return;

    if (!user || !user.id) {
      router.push("/login");
      return;
    }

    if (keranjang.length === 0) {
      router.push("/keranjang");
      return;
    }

    fetchAlamat();
  }, [user, loading, keranjang.length, router]);

  async function fetchAlamat() {
    if (!supabase || !user) return;

    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) {
      setAlamatList(data);
      const defaultAddr = data.find((a: any) => a.is_default);
      if (defaultAddr) {
        setSelectedAlamatId(defaultAddr.id);
      } else if (data.length > 0) {
        setSelectedAlamatId(data[0].id);
      }
    }
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError("User ID tidak valid. Silakan login ulang.");
      return;
    }

    const selectedAddr = alamatList.find(a => a.id === selectedAlamatId);
    if (!selectedAddr) {
      setError("Pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Call secure API endpoint
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: keranjang.map(item => ({
            id: item.id,
            nama: item.nama,
            harga: item.harga,
            jumlah: item.jumlah,
          })),
          alamat: selectedAddr,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal membuat pesanan');
      }

      // Only clear cart after successful order creation
      kosongkanKeranjang();
      router.push("/pesanan");

    } catch (error: any) {
      console.error("Checkout error:", error);
      setError(error.message || "Gagal membuat pesanan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAlamat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const { error } = await supabase.from("user_addresses").insert({
      user_id: user.id,
      ...newAlamat,
      is_default: alamatList.length === 0,
    });

    if (!error) {
      setShowAlamatForm(false);
      setNewAlamat({ label: "", alamat: "", kota: "", provinsi: "", kode_pos: "", telepon: "" });
      fetchAlamat();
    } else {
      alert("Gagal menyimpan alamat: " + error.message);
    }
  };

  if (loading) return (
    <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="container text-center">
        <div className="spinner-border mx-auto" style={{ color: '#e67e22', width: '3rem', height: '3rem' }} role="status" />
        <p className="mt-3 text-muted">Memuat checkout...</p>
      </div>
    </section>
  );

  if (!user || !user.id) return null;
  if (keranjang.length === 0) return null;

  const totalItems = keranjang.reduce((a, b) => a + b.jumlah, 0);
  const totalPrice = getTotalKeranjang();

  return (
    <section className="py-5" style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge-modern mb-3 d-inline-block" style={{ background: 'rgba(230, 126, 34, 0.1)', color: '#e67e22' }}>
            Checkout
          </span>
          <h1 className="fw-bold mb-2">Selesaikan Pesanan Anda</h1>
          <p className="text-muted">Proses cepat dan aman dengan sistem Escrow</p>
        </div>

        {/* Progress Steps */}
        <div className="card-modern mb-4 p-4">
          <div className="d-flex justify-content-between align-items-center position-relative">
            {/* Step 1 */}
            <div className="text-center flex-grow-1">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '50px', height: '50px', background: step >= 1 ? '#e67e22' : '#e0e0e0', color: 'white' }}>
                <FaMapMarkerAlt size={20} />
              </div>
              <div className="fw-bold small">Alamat</div>
            </div>

            {/* Line */}
            <div className="flex-grow-1" style={{ height: '3px', background: step >= 2 ? '#e67e22' : '#e0e0e0' }} />

            {/* Step 2 */}
            <div className="text-center flex-grow-1">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mx-auto mb-2" style={{ width: '50px', height: '50px', background: step >= 2 ? '#e67e22' : '#e0e0e0', color: 'white' }}>
                <FaLock size={20} />
              </div>
              <div className="fw-bold small">Konfirmasi</div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Checkout Form */}
          <div className="col-lg-8">
            {error && (
              <div className="alert mb-4 border-0 d-flex align-items-center gap-3" style={{ background: 'rgba(231, 76, 60, 0.08)', borderRadius: '12px' }}>
                <FaExclamationCircle size={24} style={{ color: '#e74c3c' }} />
                <div className="flex-grow-1">
                  <strong style={{ color: '#2c3e50' }}>Error</strong>
                  <p className="mb-0 text-muted small">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleCheckout}>
              {/* Alamat Section - Removed nested form, using button onClick instead */}
              <div className="card-modern mb-4 p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                    <FaMapMarkerAlt style={{ color: '#e67e22', fontSize: '20px' }} />
                    Pilih Alamat Pengiriman
                  </h5>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setShowAlamatForm(!showAlamatForm)}
                    style={{ background: 'rgba(230, 126, 34, 0.08)', color: '#e67e22', borderRadius: '10px', padding: '8px 16px', fontWeight: 600, border: 'none' }}
                  >
                    <FaPlus className="me-1" size={12} /> Tambah Alamat
                  </button>
                </div>

                {showAlamatForm && (
                  <div className="p-4 mb-4 rounded-3" style={{ background: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    <h6 className="fw-bold mb-3">Tambah Alamat Baru</h6>
                    {/* Changed from <form> to <div> to prevent nested form issue */}
                    <div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-medium small">Label Alamat</label>
                          <input type="text" className="form-control" value={newAlamat.label} onChange={(e) => setNewAlamat({...newAlamat, label: e.target.value})} placeholder="Rumah, Kantor, dll" required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-medium small">Nomor Telepon</label>
                          <input type="tel" className="form-control" value={newAlamat.telepon} onChange={(e) => setNewAlamat({...newAlamat, telepon: e.target.value})} placeholder="0812xxxxxxxxx" maxLength={15} required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-medium small">Alamat Lengkap</label>
                          <textarea className="form-control" rows={2} value={newAlamat.alamat} onChange={(e) => setNewAlamat({...newAlamat, alamat: e.target.value})} placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan" required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-medium small">Kota</label>
                          <input type="text" className="form-control" value={newAlamat.kota} onChange={(e) => setNewAlamat({...newAlamat, kota: e.target.value})} required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-medium small">Provinsi</label>
                          <input type="text" className="form-control" value={newAlamat.provinsi} onChange={(e) => setNewAlamat({...newAlamat, provinsi: e.target.value})} required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-medium small">Kode Pos</label>
                          <input type="text" className="form-control" value={newAlamat.kode_pos} onChange={(e) => setNewAlamat({...newAlamat, kode_pos: e.target.value})} placeholder="12345" maxLength={5} pattern="\d{5}" required style={{ borderRadius: '10px', border: '2px solid #e0e0e0', padding: '10px 16px' }} />
                        </div>
                      </div>
                      <div className="d-flex gap-2 mt-3">
                        <button 
                          type="button" 
                          className="btn" 
                          onClick={handleSaveAlamat}
                          style={{ background: '#e67e22', color: 'white', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, border: 'none' }}
                        >
                          Simpan Alamat
                        </button>
                        <button 
                          type="button" 
                          className="btn" 
                          onClick={() => setShowAlamatForm(false)} 
                          style={{ background: '#e0e0e0', color: '#2c3e50', borderRadius: '10px', padding: '10px 24px', fontWeight: 600, border: 'none' }}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {alamatList.length === 0 ? (
                  <div className="alert border-0 text-center" style={{ background: 'rgba(243, 156, 18, 0.08)', borderRadius: '12px' }}>
                    <FaMapMarkerAlt className="mb-2" size={32} style={{ color: '#f39c12' }} />
                    <div className="fw-medium">Belum ada alamat tersimpan</div>
                    <small className="text-muted">Silakan tambah alamat baru untuk melanjutkan</small>
                  </div>
                ) : (
                  <div className="row g-3">
                    {alamatList.map((addr) => (
                      <div key={addr.id} className="col-12">
                        <div
                          className="card-modern p-3"
                          style={{ cursor: 'pointer', border: selectedAlamatId === addr.id ? '2px solid #e67e22' : '1px solid #e0e0e0' }}
                          onClick={() => setSelectedAlamatId(addr.id)}
                        >
                          <div className="d-flex align-items-start gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', background: selectedAlamatId === addr.id ? '#e67e22' : '#e0e0e0' }}>
                              {selectedAlamatId === addr.id && <FaCheckCircle size={14} style={{ color: 'white' }} />}
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className="fw-bold mb-0">{addr.label}</h6>
                                {addr.is_default && (
                                  <span className="badge-modern" style={{ background: '#e67e22', color: 'white', fontSize: '10px' }}>
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-muted small mb-0">
                                {addr.alamat}<br />
                                {addr.kota}, {addr.provinsi} {addr.kode_pos}<br />
                                {addr.telepon}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escrow Info */}
              <div className="card-modern mb-4 p-4" style={{ background: 'rgba(52, 152, 219, 0.08)', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '50px', height: '50px', background: '#3498db' }}>
                    <FaShieldAlt style={{ color: 'white', fontSize: '24px' }} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-2">Pembayaran Aman dengan Escrow</h6>
                    <p className="small mb-0" style={{ opacity: 0.8 }}>
                      Setelah mitra menentukan ongkir, Anda akan menerima notifikasi untuk melakukan pembayaran ke rekening platform (Escrow).
                      Dana akan ditahan sampai pesanan selesai, memastikan transaksi aman.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                disabled={isLoading || alamatList.length === 0}
                style={{
                  background: isLoading || alamatList.length === 0 ? '#e0e0e0' : '#e67e22',
                  color: isLoading || alamatList.length === 0 ? '#95a5a6' : 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  fontWeight: 700,
                  fontSize: '16px',
                  border: 'none'
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <FaShoppingCart size={18} />
                    Buat Pesanan
                    <FaArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card-modern p-4" style={{ position: 'sticky', top: '80px' }}>
              <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                <FaShoppingCart style={{ color: '#e67e22' }} />
                Ringkasan Pesanan
              </h5>

              {/* Cart Items */}
              <div className="mb-4" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {keranjang.map((item) => (
                  <div key={item.id} className="d-flex gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <div className="position-relative rounded overflow-hidden flex-shrink-0" style={{ width: '60px', height: '60px', background: '#f5f5f5' }}>
                      {item.gambar ? (
                        <Image src={item.gambar} alt={item.nama} fill style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                          <FaImage size={24} style={{ color: '#e0e0e0' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-bold small mb-1">{item.nama}</div>
                      <div className="text-muted small">{item.jumlah}x</div>
                      <div className="fw-bold small" style={{ color: '#e67e22' }}>
                        Rp{(item.harga * item.jumlah).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="p-3 rounded-3 mb-3" style={{ background: '#f8f9fa' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Subtotal ({totalItems} item)</span>
                  <span className="fw-bold small">Rp{totalPrice.toLocaleString("id-ID")}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Ongkos Kirim</span>
                  <span className="text-muted small">Akan ditentukan</span>
                </div>
              </div>

              <div className="p-3 rounded-3" style={{ background: 'rgba(230, 126, 34, 0.08)', border: '1px solid rgba(230, 126, 34, 0.2)' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold fs-5" style={{ color: '#e67e22' }}>
                    Rp{totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
                <small className="text-muted d-block mt-1">*Ongkir akan dikonfirmasi oleh Mitra</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
