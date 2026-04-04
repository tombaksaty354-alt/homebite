"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaMoneyBillWave, FaDownload, FaExclamationTriangle } from "react-icons/fa";
import PaymentProofViewer from "@/components/PaymentProofViewer";

export default function AdminPaymentApprovalPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalAmount: 0,
    unreadCount: 0,
  });
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else {
        fetchOrders();
        fetchUnreadCount();
        
        // Auto-refresh setiap 30 detik untuk data baru
        const interval = setInterval(() => {
          fetchOrders();
          fetchUnreadCount();
          setLastRefresh(new Date());
        }, 30000);
        
        return () => clearInterval(interval);
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchOrders();
      fetchUnreadCount();
    }
  }, [filterStatus]);

  async function fetchUnreadCount() {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from("v_admin_unread_payment_count")
        .select("unread_count")
        .single();
      
      if (!error && data) {
        setStats(prev => ({ ...prev, unreadCount: data.unread_count || 0 }));
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }

  async function fetchOrders() {
    if (!supabase) return;

    try {
      console.log("📥 Fetching all payment orders...");

      // STEP 1: Fetch ALL orders with payment proofs
      const { data: allOrders, error: allError } = await supabase
        .from("orders")
        .select("*")
        .not("bukti_pembayaran", "is", null)
        .order("created_at", { ascending: false });

      if (allError) {
        console.error("❌ Error fetching all orders:", allError);
        throw allError;
      }

      console.log("📦 All orders fetched:", allOrders?.length || 0);

      // Calculate stats from ALL orders
      const totalPending = allOrders?.filter(o => o.status_bukti === "menunggu_konfirmasi").length || 0;
      const totalApproved = allOrders?.filter(o => o.status_bukti === "disetujui").length || 0;
      const totalRejected = allOrders?.filter(o => o.status_bukti === "ditolak").length || 0;
      const pendingAmount = allOrders
        ?.filter(o => o.status_bukti === "menunggu_konfirmasi")
        .reduce((sum, o) => sum + (o.total_bayar || 0), 0) || 0;

      console.log("📊 Calculated stats:", { 
        totalPending, 
        totalApproved, 
        totalRejected,
        pendingAmount 
      });

      setStats(prev => ({
        ...prev,
        totalPending,
        totalApproved,
        totalRejected,
        totalAmount: pendingAmount,
      }));

      // STEP 2: Fetch filtered orders for table display
      console.log("🔍 Fetching filtered orders for tab:", filterStatus);
      
      let query = supabase
        .from("orders")
        .select("*")
        .not("bukti_pembayaran", "is", null)
        .order("created_at", { ascending: false });

      if (filterStatus === "pending") {
        query = query.eq("status_bukti", "menunggu_konfirmasi");
      } else if (filterStatus === "approved") {
        query = query.eq("status_bukti", "disetujui");
      } else if (filterStatus === "rejected") {
        query = query.eq("status_bukti", "ditolak");
      }

      const { data: filteredData, error: filterError } = await query;

      if (filterError) {
        console.error("❌ Error fetching filtered orders:", filterError);
        throw filterError;
      }

      console.log("📋 Filtered orders:", filteredData?.length || 0);

      // Fetch customer & mitra names
      const ordersWithDetails = filteredData || [];
      const customerIds = [...new Set(ordersWithDetails.map(o => o.customer_id).filter(Boolean))];
      const mitraIds = [...new Set(ordersWithDetails.map(o => o.mitra_id).filter(Boolean))];

      let customers: any[] = [];
      let mitras: any[] = [];

      if (customerIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, nama, email")
          .in("id", customerIds);
        customers = data || [];
      }

      if (mitraIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, nama, email")
          .in("id", mitraIds);
        mitras = data || [];
      }

      // Enrich orders with names
      const enriched = ordersWithDetails.map(order => ({
        ...order,
        customer: customers.find(c => c.id === order.customer_id) || { nama: "-", email: "-" },
        mitra: mitras.find(m => m.id === order.mitra_id) || { nama: "-", email: "-" }
      }));

      setOrders(enriched);
      console.log("✅ Orders enriched and loaded:", enriched.length);

    } catch (error) {
      console.error("❌ Error in fetchOrders:", error);
    }
  }

  async function handleApprove(order: any) {
    if (!supabase) return;
    
    // PREVENT: Cannot approve if already approved/rejected
    if (order.status_bukti !== "menunggu_konfirmasi") {
      alert("⚠️ Pembayaran ini sudah pernah dikonfirmasi sebelumnya!");
      return;
    }
    
    if (!confirm(`Approve pembayaran untuk pesanan ${order.nomor_pesanan}?\n\nPerhatian: Konfirmasi hanya bisa dilakukan 1x dan tidak bisa diubah.`)) return;

    setIsApproving(true);

    try {
      console.log("🔄 Approving payment for order:", order.id);
      console.log("📋 Current order status:", order.status_bukti);
      
      // STEP 1: Update order status
      const { data: updateResult, error: updateError } = await supabase
        .from("orders")
        .update({
          status_bukti: "disetujui",
          status: "lunas",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .select("id, status_bukti, status, paid_at");

      console.log("✅ Update result:", { data: updateResult, error: updateError });

      if (updateError) {
        console.error("❌ Database update error:", updateError);
        throw new Error("Gagal update database: " + updateError.message);
      }

      if (!updateResult || updateResult.length === 0) {
        console.warn("⚠️ No rows updated - checking if order exists...");
        const { data: checkData } = await supabase
          .from("orders")
          .select("id, status_bukti")
          .eq("id", order.id)
          .single();
        console.log("🔍 Order current status:", checkData);
      }

      // STEP 2: Try to update tracking columns (optional - will fail if columns don't exist)
      try {
        if (user) {
          await supabase
            .from("orders")
            .update({ payment_approved_by: user.id })
            .eq("id", order.id);
        }
      } catch (trackError) {
        console.warn("⚠️ Tracking columns belum ada (optional):", trackError);
      }

      // STEP 3: Mark admin notifications as read
      try {
        if (user) {
          await supabase
            .from("notifications")
            .update({ dibaca: true })
            .eq("user_id", user.id)
            .eq("link", "/admin/payment-approval")
            .eq("dibaca", false);
        }
      } catch (e) {
        console.warn("⚠️ Failed to mark notifications as read:", e);
      }

      // STEP 4: Notify customer
      try {
        await supabase.from("notifications").insert({
          user_id: order.customer_id,
          title: "✅ Pembayaran Dikonfirmasi",
          message: `Pembayaran untuk pesanan ${order.nomor_pesanan} telah dikonfirmasi. Mitra akan segera memproses pesanan Anda.`,
          tipe: "success",
          link: "/pesanan",
        });
      } catch (e) {
        console.warn("⚠️ Failed to notify customer:", e);
      }

      // STEP 5: Notify mitra
      try {
        await supabase.from("notifications").insert({
          user_id: order.mitra_id,
          title: "💰 Pesanan Baru - Pembayaran Lunas",
          message: `Pesanan ${order.nomor_pesanan} telah lunas. Silakan proses dan kirim pesanan.`,
          tipe: "info",
          link: "/mitra-dashboard/pesanan",
        });
      } catch (e) {
        console.warn("⚠️ Failed to notify mitra:", e);
      }

      console.log("✅ All operations completed successfully!");

      // STEP 6: Close modal and refresh
      alert("✅ Pembayaran berhasil dikonfirmasi!");
      setShowProofModal(false);
      
      console.log("🔄 Refreshing data...");
      await fetchOrders();
      console.log("✅ Data refreshed, check stats above");

    } catch (error: any) {
      console.error("❌ Error approving payment:", error);
      alert("❌ Gagal approve pembayaran: " + error.message);
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!supabase || !selectedOrder) return;
    
    // PREVENT: Cannot reject if already approved/rejected
    if (selectedOrder.status_bukti !== "menunggu_konfirmasi") {
      alert("⚠️ Pembayaran ini sudah pernah dikonfirmasi sebelumnya!");
      return;
    }
    
    if (!rejectionNote.trim()) {
      alert("Tulis alasan penolakan terlebih dahulu!");
      return;
    }

    if (!confirm(`Tolak pembayaran untuk pesanan ${selectedOrder.nomor_pesanan}?\n\nPerhatian: Penolakan hanya bisa dilakukan 1x. Customer harus upload bukti baru.`)) return;

    setIsRejecting(true);

    try {
      // Update order - trigger akan otomatis set payment_rejected_by & payment_rejected_at
      const updateData: any = {
        status_bukti: "ditolak",
        catatan_penolakan: rejectionNote.trim(),
      };
      
      if (user) {
        updateData.payment_rejected_by = user.id;
      }
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Mark notification as read
      if (user) {
        await supabase
          .from("notifications")
          .update({ dibaca: true })
          .eq("user_id", user.id)
          .eq("link", "/admin/payment-approval")
          .eq("dibaca", false);
      }

      // Notification to customer
      await supabase.from("notifications").insert({
        user_id: selectedOrder.customer_id,
        title: "❌ Pembayaran Ditolak",
        message: `Pembayaran untuk pesanan ${selectedOrder.nomor_pesanan} ditolak. Alasan: ${rejectionNote}. Silakan upload bukti yang benar.`,
        tipe: "error",
        link: "/pesanan",
      });

      alert("✅ Pembayaran berhasil ditolak!");
      setShowProofModal(false);
      setRejectionNote("");
      await fetchOrders();

    } catch (error: any) {
      console.error("Error rejecting payment:", error);
      alert("❌ Gagal menolak pembayaran: " + error.message);
    } finally {
      setIsRejecting(false);
    }
  }

  async function exportToCSV() {
    if (orders.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    let csv = "No,No Pesanan,Customer,Mitra,Total,Pembayaran Metoda,Status Bukti,Tanggal\n";

    orders.forEach((order, index) => {
      csv += `${index + 1},${order.nomor_pesanan},${order.customer?.nama || '-'},${order.mitra?.nama || '-'},${order.total_bayar},${order.pembayaran_metode || '-'},${order.status_bukti},${new Date(order.created_at).toLocaleDateString('id-ID')}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-approval-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold"><FaMoneyBillWave className="me-2" /> Konfirmasi Pembayaran Platform</h2>
              <p className="text-muted mb-0">
                Approve atau tolak bukti pembayaran dari customer. Dana akan ditahan di Escrow sampai pesanan selesai.
              </p>
            </div>
            <div className="text-end">
              {stats.unreadCount > 0 && (
                <div className="badge bg-danger mb-2">
                  🔔 {stats.unreadCount} pembayaran baru
                </div>
              )}
              <div className="small text-muted">
                🕐 Last refresh: {lastRefresh.toLocaleTimeString('id-ID')}
              </div>
              <button 
                className="btn btn-sm btn-outline-primary mt-1"
                onClick={() => {
                  fetchOrders();
                  fetchUnreadCount();
                  setLastRefresh(new Date());
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Warning Card */}
        <div className="alert alert-info mb-4">
          <FaExclamationTriangle className="me-2" />
          <strong>Info:</strong> Setelah di-approve, status pesanan berubah menjadi "Lunas" dan mitra akan mendapat notifikasi untuk memproses pesanan.
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaClock size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Menunggu Konfirmasi</h6>
                <h4 className="fw-bold text-warning">
                  {stats.totalPending}
                  {stats.unreadCount > 0 && (
                    <span className="badge bg-danger ms-2">+{stats.unreadCount} baru</span>
                  )}
                </h4>
                <small>{formatRupiah(stats.totalAmount)}</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h6 className="text-muted">Sudah Disetujui</h6>
                <h4 className="fw-bold text-success">{stats.totalApproved}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-danger shadow-sm">
              <div className="card-body text-center">
                <FaTimesCircle size={30} className="text-danger mb-2" />
                <h6 className="text-muted">Ditolak</h6>
                <h4 className="fw-bold text-danger">{stats.totalRejected}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-info shadow-sm">
              <div className="card-body text-center">
                <FaDownload size={30} className="text-info mb-2" />
                <h6 className="text-muted">Export</h6>
                <button className="btn btn-sm btn-info" onClick={exportToCSV}>
                  <FaDownload className="me-1" /> CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("pending")}
              >
                <FaClock className="me-1" /> Menunggu ({stats.totalPending})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'approved' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("approved")}
              >
                <FaCheckCircle className="me-1" /> Disetujui ({stats.totalApproved})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'rejected' ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("rejected")}
              >
                <FaTimesCircle className="me-1" /> Ditolak ({stats.totalRejected})
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card shadow-sm">
          <div className="card-body">
            {orders.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FaMoneyBillWave size={48} className="mb-3" />
                <h5>Tidak ada pesanan</h5>
                <p className="mb-0">
                  {filterStatus === "pending"
                    ? "Semua pembayaran sudah dikonfirmasi"
                    : "Belum ada data"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>No Pesanan</th>
                      <th>Customer</th>
                      <th>Mitra</th>
                      <th>Total</th>
                      <th>Metode</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                      <th>Tracking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>{order.nomor_pesanan}</strong>
                        </td>
                        <td>
                          {order.customer?.nama || '-'}
                          <br />
                          <small className="text-muted">{order.customer?.email || ''}</small>
                        </td>
                        <td>
                          {order.mitra?.nama || '-'}
                        </td>
                        <td className="fw-bold">{formatRupiah(order.total_bayar || 0)}</td>
                        <td>
                          <small>{order.pembayaran_metode || '-'}</small>
                        </td>
                        <td>
                          <small>{new Date(order.created_at).toLocaleDateString('id-ID')}</small>
                        </td>
                        <td>
                          {order.status_bukti === "menunggu_konfirmasi" ? (
                            <span className="badge bg-warning text-dark">Menunggu</span>
                          ) : order.status_bukti === "disetujui" ? (
                            <span className="badge bg-success">Disetujui</span>
                          ) : (
                            <span className="badge bg-danger">Ditolak</span>
                          )}
                        </td>
                        <td>
                          {order.bukti_pembayaran && (
                            <button
                              className="btn btn-sm btn-primary me-1"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowProofModal(true);
                              }}
                            >
                              <FaEye className="me-1" /> Lihat Bukti
                            </button>
                          )}
                          {order.status_bukti === "ditolak" && order.catatan_penolakan && (
                            <small className="text-danger d-block mt-1">
                              Alasan: {order.catatan_penolakan}
                            </small>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {order.payment_review_count > 0 && (
                              <div>👁️ Reviewed {order.payment_review_count}x</div>
                            )}
                            {order.payment_approved_at && (
                              <div className="text-success">
                                ✅ {new Date(order.payment_approved_at).toLocaleDateString('id-ID')}
                              </div>
                            )}
                            {order.payment_rejected_at && (
                              <div className="text-danger">
                                ❌ {new Date(order.payment_rejected_at).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Payment Proof Modal */}
        {showProofModal && selectedOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Detail Pembayaran</h5>
                  <button type="button" className="btn-close" onClick={() => setShowProofModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info small mb-3">
                    <strong>Info Pesanan:</strong><br/>
                    No: {selectedOrder.nomor_pesanan}<br/>
                    Customer: {selectedOrder.customer?.nama}<br/>
                    Mitra: {selectedOrder.mitra?.nama}<br/>
                    Total: <strong>{formatRupiah(selectedOrder.total_bayar)}</strong><br/>
                    Metode: {selectedOrder.pembayaran_metode || '-'}
                  </div>

                  {/* Tracking Info */}
                  {(selectedOrder.payment_approved_at || selectedOrder.payment_rejected_at) && (
                    <div className="alert alert-light small mb-3 border">
                      <strong>📋 Tracking:</strong><br/>
                      {selectedOrder.payment_review_count > 0 && (
                        <span>Reviewed: {selectedOrder.payment_review_count} kali<br/></span>
                      )}
                      {selectedOrder.payment_approved_at && (
                        <span className="text-success">
                          ✅ Approved: {new Date(selectedOrder.payment_approved_at).toLocaleString('id-ID')}<br/>
                        </span>
                      )}
                      {selectedOrder.payment_rejected_at && (
                        <span className="text-danger">
                          ❌ Rejected: {new Date(selectedOrder.payment_rejected_at).toLocaleString('id-ID')}<br/>
                        </span>
                      )}
                    </div>
                  )}

                  <h6 className="fw-bold mb-3">Bukti Pembayaran:</h6>
                  <div className="text-center mb-3">
                    <img
                      src={selectedOrder.bukti_pembayaran}
                      alt="Bukti Pembayaran"
                      className="img-fluid rounded"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>

                  {/* One-time confirmation notice */}
                  <div className="alert alert-warning small mb-3">
                    <strong>⚠️ Perhatian:</strong> Konfirmasi pembayaran hanya bisa dilakukan <strong>1x</strong> oleh Platform dan tidak bisa diubah setelah dikonfirmasi.
                  </div>

                  {/* Show approve/reject buttons ONLY if status is still pending */}
                  {selectedOrder.status_bukti === "menunggu_konfirmasi" ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-bold">Alasan Penolakan (jika ditolak)</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Contoh: Nominal tidak sesuai, bukti tidak jelas, dll"
                          value={rejectionNote}
                          onChange={(e) => setRejectionNote(e.target.value)}
                        />
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success btn-lg"
                          onClick={() => handleApprove(selectedOrder)}
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <><span className="spinner-border spinner-border-sm me-2" /> Memproses...</>
                          ) : (
                            <><FaCheckCircle className="me-2" /> Approve - Bayar ke Escrow</>
                          )}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={handleReject}
                          disabled={isRejecting || !rejectionNote.trim()}
                        >
                          {isRejecting ? (
                            <><span className="spinner-border spinner-border-sm me-2" /> Memproses...</>
                          ) : (
                            <><FaTimesCircle className="me-2" /> Tolak Bukti</>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Already processed - show status message */
                    <div className={`alert ${selectedOrder.status_bukti === 'disetujui' ? 'alert-success' : 'alert-danger'} small mb-0`}>
                      <strong>
                        {selectedOrder.status_bukti === 'disetujui' ? '✅ Sudah Disetujui' : '❌ Sudah Ditolak'}
                      </strong>
                      <br/>
                      {selectedOrder.status_bukti === 'disetujui' ? (
                        <>
                          Pembayaran telah dikonfirmasi oleh Platform.<br/>
                          {selectedOrder.payment_approved_at && (
                            <span>
                              Waktu: {new Date(selectedOrder.payment_approved_at).toLocaleString('id-ID')}<br/>
                            </span>
                          )}
                          Status pesanan: <strong>Lunas</strong>
                        </>
                      ) : (
                        <>
                          Pembayaran telah ditolak oleh Platform.<br/>
                          {selectedOrder.payment_rejected_at && (
                            <span>
                              Waktu: {new Date(selectedOrder.payment_rejected_at).toLocaleString('id-ID')}<br/>
                            </span>
                          )}
                          {selectedOrder.catatan_penolakan && (
                            <span>
                              Alasan: {selectedOrder.catatan_penolakan}<br/>
                            </span>
                          )}
                          Customer dapat upload bukti baru.
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
