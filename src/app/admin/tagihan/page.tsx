"use client";

import { useState, useEffect } from "react";
import { useAuth, supabaseAdmin } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaFileInvoiceDollar, FaCheck, FaSync, FaEye } from "react-icons/fa";

export default function AdminTagihanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [pendingOrders, setPendingOrders] = useState({ count: 0, items: 0, mitras: 0 });
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else {
        fetchInvoices();
        fetchPendingOrders();
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchInvoices();
    }
  }, [filterStatus]);

  async function fetchPendingOrders() {
    try {
      console.log("=== FETCHING PENDING ORDERS ===");
      setDebugInfo({ step: "starting" });
      
      const response = await fetch('/api/admin/invoices?action=pending');
      const result = await response.json();

      console.log("API Response:", result);

      if (!result.success) {
        console.error("API Error:", result.error);
        setDebugInfo({ error: "API failed", details: result.error });
        return;
      }

      const data = result.data;
      console.log("✓ Pending orders data:", data);

      setPendingOrders({
        count: data.count,
        items: data.items,
        mitras: data.mitras
      });
      setDebugInfo({ success: true, ...data });
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      setDebugInfo({ error: "exception", details: error });
    }
  }

  async function generateInvoices() {
    if (!confirm("Generate tagihan dari SEMUA pesanan lunas/selesai?")) return;
    setIsGenerating(true);

    try {
      const now = new Date();
      const periode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const response = await fetch(`/api/admin/invoices?action=generate&periode=${periode}`);
      const result = await response.json();

      console.log("Generate API Response:", result);

      if (!result.success) {
        alert("Gagal: " + result.error);
        return;
      }

      const data = result.data;
      let message = `✅ Rekap Komisi Berhasil!\n\n`;
      message += `📊 Detail:\n`;
      message += `• Total pesanan lunas/selesai: ${data.totalOrders}\n`;
      message += `• Total item terjual: ${data.totalItems}\n`;
      message += `• Total komisi platform: Rp${data.totalKomisi.toLocaleString("id-ID")}\n`;
      message += `• Mitra ditagih: ${data.mitraCount}\n\n`;
      message += `Invoice dibuat: ${data.created} baru, ${data.updated} diupdate`;

      alert(message);
      fetchInvoices();
      fetchPendingOrders();
    } catch (error: any) {
      console.error("Generate invoices error:", error);
      alert("Gagal generate: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function fetchInvoices() {
    try {
      let url = '/api/admin/invoices?action=invoices';
      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  }

  async function verifyPayment(invoiceId: string) {
    if (!confirm("Konfirmasi bahwa tagihan ini sudah lunas?")) return;

    try {
      const response = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', invoiceId })
      });

      const result = await response.json();

      if (result.success) {
        alert("✅ Pembayaran dikonfirmasi!");
        fetchInvoices();
        fetchPendingOrders();
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (error) {
      alert("Gagal verifikasi: " + error);
    }
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  const statusBadge = (status: string) => {
    if (status === "unpaid") return <span className="badge bg-danger">Belum Bayar</span>;
    if (status === "waiting_confirmation") return <span className="badge bg-warning text-dark">Menunggu Verifikasi</span>;
    return <span className="badge bg-success">Lunas</span>;
  };

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali ke Dashboard
          </Link>
          <h2 className="fw-bold"><FaFileInvoiceDollar className="me-2" /> Rekap & Tagihan Komisi</h2>
          <p className="text-muted">Kelola penagihan komisi dari semua transaksi lunas/selesai</p>
        </div>

        {/* Summary Card - Pending Orders */}
        <div className="card shadow-sm mb-4 border-warning">
          <div className="card-body">
            <h5 className="fw-bold mb-3">📊 Ringkasan Komisi Platform</h5>
            <div className="row">
              <div className="col-md-3 mb-3">
                <div className="text-center p-3 bg-light rounded">
                  <h2 className="fw-bold text-primary mb-0">{pendingOrders.count}</h2>
                  <small className="text-muted">Total Pesanan Lunas/Selesai</small>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="text-center p-3 bg-light rounded">
                  <h2 className="fw-bold text-success mb-0">{invoices.reduce((sum: number, inv: any) => sum + (inv.total_items || 0), 0)}</h2>
                  <small className="text-muted">Item Sudah Ditagih</small>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="text-center p-3 bg-light rounded">
                  <h2 className="fw-bold text-info mb-0">{invoices.filter((i: any) => i.status === 'unpaid').length}</h2>
                  <small className="text-muted">Invoice Belum Dibayar</small>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="text-center p-3 bg-warning rounded">
                  <h2 className="fw-bold text-dark mb-0">Rp{invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0).toLocaleString("id-ID")}</h2>
                  <small className="text-muted">Total Tagihan Aktif</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Generate Tagihan Komisi</h5>
              <small className="text-muted">Hitung dari SEMUA pesanan berstatus 'Lunas'/'Selesai'</small>
            </div>
            <button className="btn btn-primary" onClick={generateInvoices} disabled={isGenerating}>
              <FaSync className={`me-2 ${isGenerating ? 'spin' : ''}`} /> {isGenerating ? "Memproses..." : "Generate Sekarang"}
            </button>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Daftar Tagihan</h5>
            <select className="form-select w-auto form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Semua Status</option>
              <option value="unpaid">Belum Bayar</option>
              <option value="waiting_confirmation">Menunggu Verifikasi</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Mitra</th>
                    <th>Periode</th>
                    <th>Item Terjual</th>
                    <th>Total Tagihan</th>
                    <th>Status</th>
                    <th>Bukti</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <div className="fw-bold">{inv.users?.nama || "Unknown"}</div>
                        <small className="text-muted">{inv.users?.email}</small>
                      </td>
                      <td>{inv.periode}</td>
                      <td>{inv.total_items} item</td>
                      <td className="fw-bold text-warning">{formatRupiah(inv.total_amount)}</td>
                      <td>{statusBadge(inv.status)}</td>
                      <td>
                        {inv.bukti_bayar ? (
                          <a href={inv.bukti_bayar} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary">
                            <FaEye /> Lihat
                          </a>
                        ) : <span className="text-muted small">-</span>}
                      </td>
                      <td>
                        {inv.status === "waiting_confirmation" && (
                          <button className="btn btn-sm btn-success" onClick={() => verifyPayment(inv.id)}>
                            <FaCheck className="me-1" /> Verifikasi Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">Tidak ada data tagihan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
