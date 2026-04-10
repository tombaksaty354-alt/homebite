"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaWallet, FaMoneyBillWave, FaCheckCircle, FaClock, FaDownload, FaUsers, FaChartLine, FaImage, FaTimes } from "react-icons/fa";
import PaymentProofViewer from "@/components/PaymentProofViewer";

export default function AdminPayoutPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [mitraSaldo, setMitraSaldo] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDitahan: 0,
    totalMenungguPayout: 0,
    totalSudahCair: 0,
    totalKomisiPlatform: 0
  });
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");

  // Payout Modal States
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [transferProof, setTransferProof] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Proof Viewer States
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState("");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else {
        fetchPayoutData();
        fetchMitraSaldo();
      }
    }
  }, [user, loading, router]);

  async function fetchPayoutData() {
    if (!supabase) return;

    try {
      // FIX: Ambil orders yang statusnya 'dikirim' (bukan 'selesai') dan pencairan 'pending'
      // Karena Customer tidak konfirmasi lagi, Admin yang trigger 'selesai' saat payout
      const { data: pendingOrders, error: pendingError } = await supabase
        .from("orders")
        .select("*")
        .eq("status_pencairan", "pending")
        .in("status", ["dikirim", "selesai"]) // Include 'dikirim'
        .order("shipped_at", { ascending: false });

      if (pendingError) {
        console.error("Error fetching pending orders:", pendingError);
      }

      // Get recently paid orders
      const { data: paidOrders, error: paidError } = await supabase
        .from("orders")
        .select("*")
        .eq("status_pencairan", "paid")
        .eq("status", "selesai")
        .order("received_at", { ascending: false })
        .limit(10);

      if (paidError) {
        console.error("Error fetching paid orders:", paidError);
      }

      const allOrders = [...(pendingOrders || []), ...(paidOrders || [])];

      // Fetch customer & mitra names separately
      const customerIds = [...new Set(allOrders.map(o => o.customer_id).filter(Boolean))];
      const mitraIds = [...new Set(allOrders.map(o => o.mitra_id).filter(Boolean))];

      let customers: any[] = [];
      let mitras: any[] = [];

      if (customerIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, nama")
          .in("id", customerIds);
        customers = data || [];
      }

      if (mitraIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("id, nama")
          .in("id", mitraIds);
        mitras = data || [];
      }

      // Enrich orders with names
      const enrichedOrders = allOrders.map(order => ({
        ...order,
        customer: customers.find(c => c.id === order.customer_id) || { nama: '-' },
        mitra: mitras.find(m => m.id === order.mitra_id) || { nama: '-' }
      }));

      setOrders(enrichedOrders);

      // Calculate stats
      const totalDitahan = pendingOrders?.reduce((sum, o) => sum + (o.total_bayar || 0), 0) || 0; // Use total_bayar for pending
      const totalKomisi = allOrders.reduce((sum, o) => sum + (o.commission_amount || 0), 0);
      const totalCair = paidOrders?.reduce((sum, o) => sum + (o.payout_amount || 0), 0) || 0;

      setStats({
        totalDitahan,
        totalMenungguPayout: pendingOrders?.length || 0,
        totalSudahCair: totalCair,
        totalKomisiPlatform: totalKomisi
      });
    } catch (error) {
      console.error("fetchPayoutData error:", error);
    }
  }

  async function fetchMitraSaldo() {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("mitra_saldo")
        .select("*")
        .order("total_pencairan", { ascending: false });

      if (error) {
        console.error("Error fetching mitra saldo:", error);
        return;
      }

      if (!data || data.length === 0) {
        setMitraSaldo([]);
        return;
      }

      // Fetch mitra names separately
      const mitraIds = data.map(m => m.mitra_id);
      const { data: mitraData } = await supabase
        .from("users")
        .select("id, nama, email")
        .in("id", mitraIds);

      // Enrich with mitra data
      const enriched = data.map(saldo => ({
        ...saldo,
        mitra: mitraData?.find(m => m.id === saldo.mitra_id) || { nama: '-', email: '-' }
      }));

      setMitraSaldo(enriched);
    } catch (error) {
      console.error("fetchMitraSaldo error:", error);
    }
  }

  function openPayoutModal(order: any) {
    setSelectedOrder(order);
    setTransferProof("");
    setShowPayoutModal(true);
  }

  async function confirmPayout() {
    if (!supabase || !selectedOrder || !transferProof.trim()) {
      alert("⚠️ Masukkan bukti transfer terlebih dahulu!");
      return;
    }

    if (!confirm(`Cairkan dana ke mitra ${selectedOrder.mitra?.nama}?\n\nPastikan bukti pengiriman sudah diverifikasi.`)) return;

    setIsConfirming(true);

    try {
      // 1. Update Order Status to 'selesai' and 'paid'
      // This triggers the commission calculation and saldo update
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "selesai",
          status_pencairan: "paid",
          received_at: new Date().toISOString(), // Set received time now
          admin_transfer_proof: transferProof.trim(),
        })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // 2. Update Mitra Saldo (Move from pending to tersedia)
      // Note: The trigger handles 'selesai', but we need to move the money manually or rely on trigger logic
      // Based on previous schema: trigger adds to 'saldo_pending' on 'selesai'.
      // So we need to move it to 'saldo_tersedia' here.
      const payoutAmount = selectedOrder.total_bayar - (selectedOrder.commission_amount || 0);

      const { error: saldoError } = await supabase.rpc('process_payout_v2', {
        mitra_id: selectedOrder.mitra_id,
        amount: payoutAmount
      });

      if (saldoError) {
        console.warn("RPC process_payout_v2 failed, trying manual update:", saldoError);
        // Fallback: Fetch current values, compute, then update
        const { data: currentSaldo } = await supabase
          .from("mitra_saldo")
          .select("saldo_pending, saldo_tersedia, total_pencairan")
          .eq("mitra_id", selectedOrder.mitra_id)
          .single();

        if (currentSaldo) {
          await supabase
            .from("mitra_saldo")
            .update({
              saldo_pending: (currentSaldo.saldo_pending || 0) - payoutAmount,
              saldo_tersedia: (currentSaldo.saldo_tersedia || 0) + payoutAmount,
              total_pencairan: (currentSaldo.total_pencairan || 0) + payoutAmount,
            })
            .eq("mitra_id", selectedOrder.mitra_id);
        }
      }

      alert("✅ Pencairan berhasil! Dana telah dicatat masuk ke saldo mitra.");
      setShowPayoutModal(false);
      await fetchPayoutData();
      await fetchMitraSaldo();

    } catch (error: any) {
      console.error("Error confirming payout:", error);
      alert("❌ Gagal proses pencairan: " + error.message);
    } finally {
      setIsConfirming(false);
    }
  }

  async function exportToCSV() {
    const pendingOrders = orders.filter(o => o.status_pencairan === "pending");
    
    if (pendingOrders.length === 0) {
      alert("Tidak ada data untuk di-export");
      return;
    }

    // Group by mitra for CSV
    const mitraMap: Record<string, { mitra: any, orders: any[], total: number }> = {};
    
    pendingOrders.forEach(order => {
      const mitraId = order.mitra_id;
      if (!mitraMap[mitraId]) {
        mitraMap[mitraId] = {
          mitra: order.mitra,
          orders: [],
          total: 0
        };
      }
      mitraMap[mitraId].orders.push(order);
      mitraMap[mitraId].total += order.payout_amount || 0;
    });

    // Create CSV content
    let csv = "No,Mitra,Nama Bank,No Rekening,Atas Nama,No Pesanan,Total Bayar,Komisi,Dana Cair,Tanggal Selesai\n";
    
    let rowNo = 1;
    Object.values(mitraMap).forEach(({ mitra, orders: mitraOrders, total }) => {
      mitraOrders.forEach(order => {
        csv += `${rowNo},${mitra?.nama || '-'},${mitra?.rekening_bank || '-'},${mitra?.nomor_rekening || '-'},${mitra?.atas_nama || '-'},${order.nomor_pesanan},${order.total_bayar},${order.commission_amount},${order.payout_amount},${new Date(order.received_at).toLocaleDateString('id-ID')}\n`;
        rowNo++;
      });
      // Add subtotal row for each mitra
      csv += `,,SUBTOTAL ${mitra?.nama || '-'},,,,,,${total}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  const filteredOrders = filterStatus === "pending"
    ? orders.filter(o => o.status_pencairan === "pending")
    : orders.filter(o => o.status_pencairan === "paid");

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold"><FaWallet className="me-2" /> Rekening Bersama - Pencairan Dana</h2>
          <p className="text-muted">Kelola pencairan dana ke mitra setelah pesanan selesai</p>
          <div className="d-flex gap-2 mt-2">
            <Link href="/admin/platform-rekening" className="btn btn-sm btn-outline-primary">
              🏦 Kelola Rekening Platform
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaClock size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Menunggu Pencairan</h6>
                <h4 className="fw-bold text-warning">{stats.totalMenungguPayout}</h4>
                <small>{formatRupiah(stats.totalDitahan)}</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaCheckCircle size={30} className="text-success mb-2" />
                <h6 className="text-muted">Sudah Cair</h6>
                <h4 className="fw-bold text-success">{formatRupiah(stats.totalSudahCair)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-primary shadow-sm">
              <div className="card-body text-center">
                <FaMoneyBillWave size={30} className="text-primary mb-2" />
                <h6 className="text-muted">Komisi Platform</h6>
                <h4 className="fw-bold text-primary">{formatRupiah(stats.totalKomisiPlatform)}</h4>
                <small>Rp500 × item terjual</small>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-info shadow-sm">
              <div className="card-body text-center">
                <FaUsers size={30} className="text-info mb-2" />
                <h6 className="text-muted">Total Mitra</h6>
                <h4 className="fw-bold text-info">{mitraSaldo.length}</h4>
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
                <FaClock className="me-1" /> Menunggu Pencairan ({stats.totalMenungguPayout})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'paid' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setFilterStatus("paid")}
              >
                <FaCheckCircle className="me-1" /> Sudah Cair
              </button>
            </div>
            <div className="d-flex gap-2">
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
                <FaWallet size={48} className="mb-3" />
                <h5>Tidak ada pesanan</h5>
                <p className="mb-0">
                  {filterStatus === "pending"
                    ? "Semua pesanan sudah dicairkan"
                    : "Belum ada pesanan yang dicairkan"}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>No Pesanan</th>
                      <th>Mitra</th>
                      <th>Total</th>
                      <th>Bukti Kirim</th>
                      <th>Rekening</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className={selectedOrders.includes(order.id) ? "table-active" : ""}>
                        <td>
                          <strong>{order.nomor_pesanan}</strong>
                        </td>
                        <td>{order.mitra?.nama || '-'}</td>
                        <td>{formatRupiah(order.total_bayar || 0)}</td>
                        <td>
                          {order.bukti_pengiriman_url ? (
                            <button 
                              className="btn btn-sm btn-outline-info"
                              onClick={() => {
                                setViewingProofUrl(order.bukti_pengiriman_url);
                                setShowProofViewer(true);
                              }}
                            >
                              <FaImage className="me-1" /> Lihat
                            </button>
                          ) : (
                            <span className="text-muted small">Belum ada</span>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const mitraSaldoData = mitraSaldo.find(m => m.mitra_id === order.mitra_id);
                            const rekeningBank = mitraSaldoData?.rekening_bank || order.mitra?.rekening_bank;
                            const nomorRekening = mitraSaldoData?.nomor_rekening || order.mitra?.nomor_rekening;
                            
                            return rekeningBank && nomorRekening ? (
                              <small>
                                {rekeningBank}<br />
                                {nomorRekening}
                              </small>
                            ) : (
                              <span className="text-danger small">Belum diisi</span>
                            );
                          })()}
                        </td>
                        <td>
                          {order.status_pencairan === "pending" ? (
                            <span className="badge bg-warning text-dark">Menunggu</span>
                          ) : (
                            <span className="badge bg-success">Cair</span>
                          )}
                        </td>
                        <td>
                          {order.status_pencairan === "pending" && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => openPayoutModal(order)}
                              disabled={!order.bukti_pengiriman_url}
                            >
                              <FaCheckCircle className="me-1" /> Cairkan
                            </button>
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

        {/* Mitra Saldo Summary */}
        {mitraSaldo.length > 0 && (
          <div className="card shadow-sm mt-4">
            <div className="card-header bg-white">
              <h5 className="mb-0"><FaChartLine className="me-2" /> Saldo Mitra</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Mitra</th>
                      <th>Email</th>
                      <th>Saldo Tersedia</th>
                      <th>Saldo Pending</th>
                      <th>Total Pencairan</th>
                      <th>Rekening</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mitraSaldo.map((mitra) => (
                      <tr key={mitra.mitra_id}>
                        <td><strong>{mitra.mitra?.nama || '-'}</strong></td>
                        <td>{mitra.mitra?.email || '-'}</td>
                        <td className="text-success">{formatRupiah(mitra.saldo_tersedia || 0)}</td>
                        <td className="text-warning">{formatRupiah(mitra.saldo_pending || 0)}</td>
                        <td>{formatRupiah(mitra.total_pencairan || 0)}</td>
                        <td>
                          {mitra.rekening_bank && mitra.nomor_rekening ? (
                            <small>
                              {mitra.rekening_bank} - {mitra.nomor_rekening}<br />
                              a.n. {mitra.atas_nama}
                            </small>
                          ) : (
                            <span className="text-muted small">Belum diisi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Payment Proof Viewer Modal */}
        <PaymentProofViewer
          isOpen={showProofViewer}
          onClose={() => setShowProofViewer(false)}
          proofUrl={viewingProofUrl}
        />

        {/* Payout Confirmation Modal */}
        {showPayoutModal && selectedOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-success text-white">
                  <h5 className="modal-title"><FaCheckCircle className="me-2" /> Proses Pencairan Dana</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowPayoutModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {/* Left: Delivery Proof */}
                    <div className="col-md-6 mb-3">
                      <h6 className="fw-bold text-info"><FaImage className="me-2" /> Bukti Pengiriman (Mitra)</h6>
                      {selectedOrder.bukti_pengiriman_url ? (
                        <img
                          src={selectedOrder.bukti_pengiriman_url}
                          alt="Bukti Pengiriman"
                          className="img-fluid rounded border mb-2"
                          style={{ maxHeight: '250px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => {
                            setViewingProofUrl(selectedOrder.bukti_pengiriman_url);
                            setShowProofViewer(true);
                          }}
                        />
                      ) : (
                        <div className="alert alert-warning small">Tidak ada bukti pengiriman.</div>
                      )}
                      <div className="small text-muted">
                        <strong>Order:</strong> {selectedOrder.nomor_pesanan}<br/>
                        <strong>Mitra:</strong> {selectedOrder.mitra?.nama}<br/>
                        <strong>Total:</strong> {formatRupiah(selectedOrder.total_bayar)}
                      </div>
                    </div>

                    {/* Right: Transfer Proof Input */}
                    <div className="col-md-6 mb-3">
                      <h6 className="fw-bold text-success"><FaMoneyBillWave className="me-2" /> Bukti Transfer (Admin)</h6>
                      <div className="alert alert-info small mb-3">
                        <strong>Rekening Tujuan:</strong><br/>
                        {(() => {
                          const mitraSaldoData = mitraSaldo.find(m => m.mitra_id === selectedOrder.mitra_id);
                          const bank = mitraSaldoData?.rekening_bank || '-';
                          const nomor = mitraSaldoData?.nomor_rekening || '-';
                          const nama = mitraSaldoData?.atas_nama || '-';
                          return `${bank} - ${nomor} (a.n ${nama})`;
                        })()}
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-bold">Upload Bukti Transfer <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Paste link gambar bukti transfer atau ID transaksi..."
                          value={transferProof}
                          onChange={(e) => setTransferProof(e.target.value)}
                          disabled={isConfirming}
                        />
                        <small className="text-muted">Wajib diisi sebagai arsip pencairan.</small>
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-success"
                          onClick={confirmPayout}
                          disabled={isConfirming || !transferProof.trim()}
                        >
                          {isConfirming ? (
                            <><span className="spinner-border spinner-border-sm me-2" /> Memproses...</>
                          ) : (
                            <><FaCheckCircle className="me-2" /> Konfirmasi & Cairkan Dana</>
                          )}
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPayoutModal(false)}
                          disabled={isConfirming}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
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
