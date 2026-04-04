"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaFileInvoiceDollar, FaUpload, FaEye, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function MitraTagihanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [buktiBayar, setBuktiBayar] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "mitra") router.push("/");
      else fetchInvoices();
    }
  }, [user, loading, router]);

  async function fetchInvoices() {
    if (!user) return;
    
    try {
      const response = await fetch('/api/admin/invoices?action=invoices');
      const result = await response.json();

      if (result.success && result.data) {
        // Filter invoices for this mitra
        const mitraInvoices = result.data.filter((inv: any) => inv.mitra_id === user.id);
        setInvoices(mitraInvoices);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }

  async function handleUploadBukti() {
    if (!selectedInvoice || !buktiBayar.trim()) {
      alert("Masukkan link bukti pembayaran");
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upload_proof',
          invoiceId: selectedInvoice.id,
          bukti_bayar: buktiBayar
        })
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      alert("✅ Bukti pembayaran berhasil dikirim! Tunggu verifikasi admin.");
      setShowUploadModal(false);
      setBuktiBayar("");
      fetchInvoices();
    } catch (error: any) {
      alert("Gagal mengirim bukti: " + error.message);
    } finally {
      setIsUploading(false);
    }
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  function formatPeriode(periode: string) {
    const [tahun, bulan] = periode.split("-");
    const bulanNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${bulanNames[parseInt(bulan) - 1]} ${tahun}`;
  }

  const statusBadge = (status: string) => {
    switch(status) {
      case "unpaid":
        return <span className="badge bg-danger">Belum Bayar</span>;
      case "waiting_confirmation":
        return <span className="badge bg-warning text-dark">Menunggu Verifikasi</span>;
      case "paid":
        return <span className="badge bg-success">Lunas</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/mitra-dashboard" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali ke Dashboard
          </Link>
          <h2 className="fw-bold"><FaFileInvoiceDollar className="me-2" /> Tagihan Komisi Saya</h2>
          <p className="text-muted">Komisi ditagihkan setiap bulan dari transaksi yang selesai/lunas</p>
        </div>

        {/* Info Box */}
        <div className="alert alert-info d-flex align-items-center mb-4">
          <FaExclamationTriangle size={24} className="me-3 flex-shrink-0" />
          <div>
            <strong>Cara Pembayaran:</strong>
            <p className="mb-0 small">
              Transfer nominal tagihan ke rekening Platform yang terdaftar.
              Setelah transfer, upload bukti transfer di tombol bawah ini.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-danger shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted">Total Belum Dibayar</h6>
                <h3 className="fw-bold text-danger">
                  {formatRupiah(invoices.filter(i => i.status === "unpaid").reduce((sum, i) => sum + i.total_amount, 0))}
                </h3>
                <small className="text-muted">{invoices.filter(i => i.status === "unpaid").length} tagihan</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted">Menunggu Verifikasi</h6>
                <h3 className="fw-bold text-warning">
                  {formatRupiah(invoices.filter(i => i.status === "waiting_confirmation").reduce((sum, i) => sum + i.total_amount, 0))}
                </h3>
                <small className="text-muted">{invoices.filter(i => i.status === "waiting_confirmation").length} tagihan</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <h6 className="text-muted">Sudah Lunas</h6>
                <h3 className="fw-bold text-success">
                  {formatRupiah(invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.total_amount, 0))}
                </h3>
                <small className="text-muted">{invoices.filter(i => i.status === "paid").length} tagihan</small>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        <div className="card shadow-sm">
          <div className="card-header bg-white">
            <h5 className="mb-0">Riwayat Tagihan</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Periode</th>
                    <th>Item Terjual</th>
                    <th>Total Tagihan</th>
                    <th>Status</th>
                    <th>Tgl Bayar</th>
                    <th>Bukti</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="fw-bold">{formatPeriode(inv.periode)}</td>
                      <td>{inv.total_items} item</td>
                      <td className="fw-bold text-warning">{formatRupiah(inv.total_amount)}</td>
                      <td>{statusBadge(inv.status)}</td>
                      <td>
                        {inv.dibayar_pada 
                          ? new Date(inv.dibayar_pada).toLocaleDateString("id-ID")
                          : "-"
                        }
                      </td>
                      <td>
                        {inv.bukti_bayar ? (
                          <a href={inv.bukti_bayar} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                            <FaEye /> Lihat
                          </a>
                        ) : <span className="text-muted small">-</span>}
                      </td>
                      <td>
                        {inv.status === "unpaid" && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowUploadModal(true);
                            }}
                          >
                            <FaUpload className="me-1" /> Bayar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Belum ada tagihan. Tagihan akan dibuat otomatis setiap bulan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && selectedInvoice && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Kirim Bukti Pembayaran</h5>
                  <button type="button" className="btn-close" onClick={() => { setShowUploadModal(false); setBuktiBayar(""); }}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info small mb-3">
                    <strong>Detail Tagihan:</strong><br/>
                    Periode: {formatPeriode(selectedInvoice.periode)}<br/>
                    Item Terjual: {selectedInvoice.total_items} item<br/>
                    Total Tagihan: <strong>{formatRupiah(selectedInvoice.total_amount)}</strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Link Bukti Transfer / ID Transaksi</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Paste link gambar atau ID transaksi" 
                      value={buktiBayar} 
                      onChange={e => setBuktiBayar(e.target.value)} 
                    />
                    <small className="text-muted">Contoh: Link Imgur/Google Drive atau "TRX123456"</small>
                  </div>

                  <div className="d-grid gap-2">
                    <button className="btn btn-success" onClick={handleUploadBukti} disabled={isUploading || !buktiBayar}>
                      {isUploading ? "Mengirim..." : <><FaUpload className="me-2" /> Kirim Bukti Bayar</>}
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => { setShowUploadModal(false); setBuktiBayar(""); }}>
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
