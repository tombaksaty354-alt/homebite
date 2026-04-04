"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaMoneyBillWave, FaCheckCircle, FaClock, FaDownload, FaUndo, FaExclamationTriangle } from "react-icons/fa";

export default function AdminRefundPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refundOrders, setRefundOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalProcessed: 0,
    totalAmount: 0,
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("pending");
  
  // Refund proof upload states
  const [refundModal, setRefundModal] = useState(false);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<any>(null);
  const [refundProofUrl, setRefundProofUrl] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else fetchRefundData();
    }
  }, [user, loading, router]);

  async function fetchRefundData() {
    if (!supabase) return;

    // Get orders that need refund (canceled after payment)
    const { data: pendingRefunds, error: pendingError } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customer_id(nama, email),
        customer_rekening:refund_rekening_id(bank, nomor, atas_nama)
      `)
      .eq("refund_status", "pending")
      .eq("status", "dibatalkan")
      .not("paid_at", "is", null)
      .order("canceled_at", { ascending: false });

    // Get recently processed refunds
    const { data: processedRefunds, error: processedError } = await supabase
      .from("orders")
      .select(`
        *,
        customer:customer_id(nama, email),
        customer_rekening:refund_rekening_id(bank, nomor, atas_nama)
      `)
      .eq("refund_status", "processed")
      .eq("status", "dibatalkan")
      .order("canceled_at", { ascending: false })
      .limit(20);

    if (pendingError) console.error("Error fetching pending refunds:", pendingError);
    if (processedError) console.error("Error fetching processed refunds:", processedError);

    const allOrders = [...(pendingRefunds || []), ...(processedRefunds || [])];
    setRefundOrders(allOrders);

    // Calculate stats
    const totalPending = pendingRefunds?.reduce((sum, o) => sum + (o.total_bayar || 0), 0) || 0;
    const totalProcessed = processedRefunds?.reduce((sum, o) => sum + (o.total_bayar || 0), 0) || 0;

    setStats({
      totalPending: pendingRefunds?.length || 0,
      totalProcessed: processedRefunds?.length || 0,
      totalAmount: totalPending + totalProcessed,
    });
  }

  function toggleSelectOrder(orderId: string) {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }

  function toggleSelectAll() {
    const pendingOrderIds = refundOrders
      .filter(o => o.refund_status === "pending")
      .map(o => o.id);
    
    setSelectedOrders(prev =>
      prev.length === pendingOrderIds.length ? [] : pendingOrderIds
    );
  }

  async function processRefund() {
    if (!supabase || selectedOrders.length === 0) return;

    if (!confirm(`Proses refund untuk ${selectedOrders.length} pesanan?\n\nSetelah diproses, admin harus transfer manual ke rekening customer.`)) return;

    setIsProcessing(true);

    try {
      for (const orderId of selectedOrders) {
        const { error } = await supabase
          .from("orders")
          .update({
            refund_status: "processed",
          })
          .eq("id", orderId);

        if (error) throw error;
      }

      alert(`✅ Refund berhasil ditandai untuk ${selectedOrders.length} pesanan!\n\nLANGKAH SELANJUTNYA:\n1. Export CSV untuk detail rekening\n2. Transfer manual via mobile/Internet banking\n3. Simpan bukti transfer`);
      setSelectedOrders([]);
      await fetchRefundData();

    } catch (error: any) {
      console.error("Error processing refund:", error);
      alert("❌ Gagal proses refund: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // Open refund modal for single order
  function openRefundModal(order: any) {
    setSelectedRefundOrder(order);
    setRefundProofUrl("");
    setRefundModal(true);
  }

  // Process single refund with proof upload
  async function handleCompleteRefund() {
    if (!supabase || !selectedRefundOrder || !refundProofUrl.trim()) {
      alert("Upload bukti transfer terlebih dahulu!");
      return;
    }

    setIsRefunding(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          refund_status: "completed",
          refund_proof_url: refundProofUrl,
          refund_processed_at: new Date().toISOString(),
        })
        .eq("id", selectedRefundOrder.id);

      if (error) throw error;

      // Notify customer
      await supabase.from("notifications").insert({
        user_id: selectedRefundOrder.customer_id,
        title: "✅ Refund Berhasil",
        message: `Refund untuk pesanan ${selectedRefundOrder.nomor_pesanan} sebesar ${formatRupiah(selectedRefundOrder.total_bayar)} telah ditransfer.`,
        tipe: "success",
        link: "/pesanan",
      });

      alert("✅ Refund berhasil diselesaikan!");
      setRefundModal(false);
      setRefundProofUrl("");
      await fetchRefundData();

    } catch (error: any) {
      console.error("Error completing refund:", error);
      alert("❌ Gagal menyelesaikan refund: " + error.message);
    } finally {
      setIsRefunding(false);
    }
  }

  async function exportToCSV() {
    const pendingOrders = refundOrders.filter(o => o.refund_status === "pending");
    
    if (pendingOrders.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    let csv = "No,No Pesanan,Customer,Email,Total Refund,Bank Tujuan,No Rekening,Atas Nama,Tanggal Batal,Alasan\n";
    
    pendingOrders.forEach((order, index) => {
      csv += `${index + 1},${order.nomor_pesanan},${order.customer?.nama || '-'},${order.customer?.email || '-'},${order.total_bayar},${order.customer_rekening?.bank || '-'},${order.customer_rekening?.nomor || '-'},${order.customer_rekening?.atas_nama || '-'},${new Date(order.canceled_at).toLocaleDateString('id-ID')},${order.cancel_reason || '-'}\n`;
    });

    // Add summary
    const totalAmount = pendingOrders.reduce((sum, o) => sum + (o.total_bayar || 0), 0);
    csv += `\n,,,,TOTAL REFUND:,${totalAmount},,,,,\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  const filteredOrders = filterStatus === "pending"
    ? refundOrders.filter(o => o.refund_status === "pending")
    : refundOrders.filter(o => o.refund_status === "processed");

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaUndo className="me-2" /> Manajemen Refund Customer</h2>
          <p className="text-muted">
            Kelola pengembalian dana untuk customer yang membatalkan pesanan setelah pembayaran.
            Dana akan dikembalikan ke rekening customer yang sudah terdaftar.
          </p>
        </div>

        {/* Warning Card */}
        <div className="alert alert-warning mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Penting:</strong> Refund hanya untuk pesanan yang sudah dibayar customer tetapi dibatalkan sebelum pengiriman.
          Pastikan customer sudah mengisi rekening di halaman "Rekening Saya" sebelum memproses refund.
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaClock size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Menunggu Refund</h6>
                <h4 className="fw-bold text-warning">{stats.totalPending}</h4>
                <small>Pesanan perlu diproses</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h6 className="text-muted">Sudah Diproses</h6>
                <h4 className="fw-bold text-success">{stats.totalProcessed}</h4>
                <small>Menunggu transfer manual</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-info shadow-sm">
              <div className="card-body text-center">
                <FaMoneyBillWave size={30} className="text-info mb-2" />
                <h6 className="text-muted">Total Dana Refund</h6>
                <h4 className="fw-bold text-info">{formatRupiah(stats.totalAmount)}</h4>
                <small>Semua refund (pending + processed)</small>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("pending")}
              >
                <FaClock className="me-1" /> Menunggu Refund ({stats.totalPending})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'processed' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("processed")}
              >
                <FaCheckCircle className="me-1" /> Sudah Diproses ({stats.totalProcessed})
              </button>
            </div>
            <div className="d-flex gap-2">
              {filterStatus === "pending" && selectedOrders.length > 0 && (
                <button className="btn btn-success" onClick={processRefund} disabled={isProcessing}>
                  {isProcessing ? (
                    <><span className="spinner-border spinner-border-sm me-2" /> Memproses...</>
                  ) : (
                    <><FaCheckCircle className="me-2" /> Proses {selectedOrders.length} Refund</>
                  )}
                </button>
              )}
              <button className="btn btn-outline-primary" onClick={exportToCSV}>
                <FaDownload className="me-1" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card shadow-sm">
          <div className="card-body">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaUndo size={48} className="mb-3" />
                <h5>Tidak ada refund</h5>
                <p className="mb-0">
                  {filterStatus === "pending" 
                    ? "Semua refund sudah diproses" 
                    : "Belum ada refund yang diproses"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      {filterStatus === "pending" && (
                        <th>
                          <input
                            type="checkbox"
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
                      )}
                      <th>No Pesanan</th>
                      <th>Customer</th>
                      <th>Total Refund</th>
                      <th>Rekening Tujuan</th>
                      <th>Alasan Batal</th>
                      <th>Tanggal Batal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className={selectedOrders.includes(order.id) ? "table-active" : ""}>
                        {filterStatus === "pending" && (
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => toggleSelectOrder(order.id)}
                            />
                          </td>
                        )}
                        <td>
                          <strong>{order.nomor_pesanan}</strong>
                        </td>
                        <td>
                          {order.customer?.nama || '-'}
                          <br />
                          <small className="text-muted">{order.customer?.email || ''}</small>
                        </td>
                        <td className="text-danger fw-bold">{formatRupiah(order.total_bayar || 0)}</td>
                        <td>
                          {order.customer_rekening?.bank && order.customer_rekening?.nomor ? (
                            <small>
                              <strong>{order.customer_rekening.bank}</strong><br />
                              {order.customer_rekening.nomor}<br />
                              a.n. {order.customer_rekening.atas_nama}
                            </small>
                          ) : (
                            <span className="text-danger small">
                              ⚠️ Customer belum set rekening
                            </span>
                          )}
                        </td>
                        <td>
                          <small>{order.cancel_reason || '-'}</small>
                        </td>
                        <td>
                          <small>{new Date(order.canceled_at).toLocaleDateString('id-ID')}</small>
                        </td>
                        <td>
                          {order.refund_status === "pending" ? (
                            <span className="badge bg-warning text-dark">Menunggu</span>
                          ) : order.refund_status === "processed" ? (
                            <span className="badge bg-info">Diproses</span>
                          ) : (
                            <span className="badge bg-success">Selesai</span>
                          )}
                        </td>
                        <td>
                          {order.refund_status === "processed" && (
                            <button 
                              className="btn btn-sm btn-success" 
                              onClick={() => openRefundModal(order)}
                            >
                              <FaCheckCircle className="me-1" /> Selesaikan
                            </button>
                          )}
                          {order.refund_proof_url && (
                            <a 
                              href={order.refund_proof_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="btn btn-sm btn-outline-primary ms-1"
                            >
                              Lihat Bukti
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="card shadow-sm mt-4 border-info">
          <div className="card-body">
            <h6 className="fw-bold text-info">ℹ️ Cara Kerja Sistem Refund</h6>
            <ol className="small mb-2">
              <li><strong>Customer Batal:</strong> Customer membatalkan pesanan yang sudah dibayar</li>
              <li><strong>Auto Queue:</strong> Pesanan masuk ke queue refund dengan status "pending"</li>
              <li><strong>Admin Proses:</strong> Admin klik "Proses Refund" untuk menandai siap transfer</li>
              <li><strong>Export CSV:</strong> Download data rekening customer untuk transfer batch</li>
              <li><strong>Transfer Manual:</strong> Admin transfer via mobile/Internet banking</li>
              <li><strong>Selesai:</strong> Refund selesai, dana kembali ke customer</li>
            </ol>
            <p className="small mb-0 text-danger">
              <strong>Catatan:</strong> Pastikan customer sudah mengisi rekening di halaman "Rekening Saya" sebelum memproses refund.
              Jika customer belum punya rekening, hubungi customer terlebih dahulu.
            </p>
          </div>
        </div>

        {/* Modal Complete Refund */}
        {refundModal && selectedRefundOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title"><FaCheckCircle className="me-2" /> Selesaikan Refund</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setRefundModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info small mb-3">
                    <strong>Detail Refund:</strong><br/>
                    No Pesanan: {selectedRefundOrder.nomor_pesanan}<br/>
                    Customer: {selectedRefundOrder.customer?.nama}<br/>
                    Total Refund: <strong className="text-danger">{formatRupiah(selectedRefundOrder.total_bayar)}</strong><br/>
                    Rekening Tujuan: {selectedRefundOrder.customer_rekening?.bank} - {selectedRefundOrder.customer_rekening?.nomor}<br/>
                    a.n. {selectedRefundOrder.customer_rekening?.atas_nama}
                  </div>

                  <div className="alert alert-warning small mb-3">
                    <strong>⚠️ Langkah:</strong><br/>
                    1. Transfer ke rekening customer di atas<br/>
                    2. Screenshot bukti transfer<br/>
                    3. Upload ke form di bawah ini
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Link Bukti Transfer Refund</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Paste link gambar bukti transfer (Imgur, Google Drive, dll)"
                      value={refundProofUrl}
                      onChange={(e) => setRefundProofUrl(e.target.value)}
                    />
                    <small className="text-muted">Upload gambar ke Imgur/Google Drive lalu paste link-nya</small>
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-success" 
                      onClick={handleCompleteRefund} 
                      disabled={isRefunding || !refundProofUrl}
                    >
                      {isRefunding ? (
                        <><span className="spinner-border spinner-border-sm me-2" /> Memproses...</>
                      ) : (
                        <><FaCheckCircle className="me-2" /> Ya, Refund Sudah Ditransfer</>
                      )}
                    </button>
                    <button 
                      className="btn btn-outline-secondary" 
                      onClick={() => { setRefundModal(false); setRefundProofUrl(""); }}
                    >
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
