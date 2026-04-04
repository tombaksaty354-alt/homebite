"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaMoneyBillWave, FaCheck, FaComments, FaClock, FaTruck, FaImage, FaCheckCircle, FaTimesCircle, FaChartLine, FaWallet, FaSearchPlus, FaUpload } from "react-icons/fa";
import Link from "next/link";
import PaymentProofViewer from "@/components/PaymentProofViewer";
import DeliveryProofUpload from "@/components/DeliveryProofUpload";

export default function MitraPesanan() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [ongkirInputs, setOngkirInputs] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalPendapatan: 0, totalKomisi: 0, danaBersih: 0 });
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState("");
  const [uploadingDeliveryProof, setUploadingDeliveryProof] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "mitra") router.push("/");
      else {
        fetchOrders();
        fetchStats();
      }
    }
  }, [user, loading, router]);

  async function fetchOrders() {
    if (!user || !supabase) return;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("mitra_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data);
  }

  async function fetchStats() {
    if (!user || !supabase) return;
    const { data } = await supabase
      .from("orders")
      .select("total_bayar, komisi_dipotong")
      .eq("mitra_id", user.id)
      .eq("status", "lunas");
    
    if (data) {
      const pendapatan = data.reduce((sum, o) => sum + (o.total_bayar || 0), 0);
      const komisi = data.reduce((sum, o) => sum + (o.komisi_dipotong || 0), 0);
      setStats({ totalPendapatan: pendapatan, totalKomisi: komisi, danaBersih: pendapatan - komisi });
    }
  }

  async function handleUpdate(orderId: string, newStatus: string, extraData?: any) {
    if (!supabase) return;
    setIsUpdating(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // 1. Inisialisasi update dengan status baru
      let updateData: any = { status: newStatus };

      // 2. Tambahkan kolom DB yang valid dari extraData (jika ada)
      if (extraData) {
        if (extraData.ongkir !== undefined) updateData.ongkir = extraData.ongkir;
        if (extraData.total_bayar !== undefined) updateData.total_bayar = extraData.total_bayar;
      }

      // 3. Handle Flag Logika (JANGAN dikirim ke database sebagai kolom)
      if (extraData?.from_bukti) {
        const { data: items } = await supabase
          .from("order_items")
          .select("jumlah")
          .eq("order_id", orderId);
        
        const totalItems = items?.reduce((sum: number, i: any) => sum + i.jumlah, 0) || 0;
        const komisi = totalItems * 500; 
        const danaMitra = (order.total_bayar || 0) - komisi;

        updateData = {
          status: "lunas",
          komisi_dipotong: komisi,
          dana_dicairkan: true,
          tanggal_cair: new Date().toISOString(),
          status_bukti: "disetujui",
          catatan_mitra: `Komisi: Rp${komisi.toLocaleString("id-ID")} | Dana Mitra: Rp${danaMitra.toLocaleString("id-ID")}`
        };
      }

      if (extraData?.tolak_bukti) {
        updateData = {
          status: "menunggu_pembayaran",
          status_bukti: "ditolak",
          catatan_penolakan: extraData.catatan || "Bukti tidak valid"
        };
      }

      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) throw error;
      
      fetchOrders();
      fetchStats();
      alert("✅ Berhasil!");
    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleDeliveryProofUpload(orderId: string, photoUrl: string) {
    if (!supabase || !photoUrl) return;

    setUploadingDeliveryProof(orderId);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          bukti_pengiriman_url: photoUrl,
          bukti_pengiriman_at: new Date().toISOString(),
          shipped_at: new Date().toISOString(),
          status: "dikirim"
        })
        .eq("id", orderId);

      if (error) throw error;

      alert("✅ Bukti pengiriman berhasil diupload! Customer akan mendapat notifikasi.");
      await fetchOrders();
    } catch (error: any) {
      console.error("Error uploading delivery proof:", error);
      alert("❌ Gagal upload bukti pengiriman: " + error.message);
    } finally {
      setUploadingDeliveryProof(null);
    }
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "mitra") return null;

  return (
    <section className="py-5" style={{ backgroundColor: "#f5f6fa" }}>
      <div className="container">
        <div className="mb-4">
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => router.push("/mitra-dashboard")}>
            <FaArrowLeft className="me-1" /> Kembali
          </button>
          <h2 className="fw-bold">Kelola Pesanan</h2>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-success shadow-sm">
              <div className="card-body text-center">
                <FaWallet size={30} className="text-success mb-2" />
                <h6 className="text-muted">Total Pendapatan</h6>
                <h4 className="fw-bold text-success">{formatRupiah(stats.totalPendapatan)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-warning shadow-sm">
              <div className="card-body text-center">
                <FaChartLine size={30} className="text-warning mb-2" />
                <h6 className="text-muted">Total Komisi Platform</h6>
                <h4 className="fw-bold text-warning">{formatRupiah(stats.totalKomisi)}</h4>
                <small className="text-muted">Rp500 × item terjual</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm" style={{ borderTop: "4px solid #e67e22" }}>
              <div className="card-body text-center">
                <h6 className="text-muted">Dana Bersih Mitra</h6>
                <h4 className="fw-bold" style={{ color: "#e67e22" }}>{formatRupiah(stats.danaBersih)}</h4>
                <small className="text-muted">Sudah dicairkan ke rekening</small>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaMoneyBillWave size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Belum ada pesanan</h5>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card shadow-sm mb-3 border-start border-4 border-primary">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-1">{order.nomor_pesanan}</h5>
                    <p className="text-muted small mb-2">
                      <FaClock className="me-1" /> {new Date(order.created_at).toLocaleString("id-ID")}
                    </p>
                    <div className="d-flex gap-3 small">
                      <span>Subtotal: <strong>{formatRupiah(order.subtotal_produk)}</strong></span>
                      {order.ongkir > 0 && <span>Ongkir: <strong className="text-success">{formatRupiah(order.ongkir)}</strong></span>}
                    </div>
                    <h4 className="mt-2 fw-bold" style={{ color: "#e67e22" }}>
                      Total: {formatRupiah(order.total_bayar || order.subtotal_produk)}
                    </h4>
                    
                    {order.bukti_pembayaran && order.status_bukti === "menunggu_konfirmasi" && (
                      <div className="alert alert-warning small mt-2 py-2">
                        <FaImage className="me-1" /> Bukti Pembayaran: 
                        <button 
                          className="btn btn-sm btn-link p-0 ms-1 fw-bold"
                          onClick={() => {
                            setViewingProofUrl(order.bukti_pembayaran);
                            setShowProofViewer(true);
                          }}
                          style={{ textDecoration: 'none' }}
                        >
                          <FaSearchPlus className="me-1" /> Lihat Bukti
                        </button>
                      </div>
                    )}
                    {order.status_bukti === "ditolak" && (
                      <div className="alert alert-danger small mt-2 py-2">
                        Bukti ditolak: {order.catatan_penolakan}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 border-start">
                    <div className="p-3">
                      <div className="mb-3 text-center">
                        <span className={`badge fs-6 ${
                          order.status === "menunggu_ongkir" ? "bg-warning text-dark" :
                          order.status === "menunggu_pembayaran" ? "bg-info text-dark" :
                          order.status === "lunas" ? "bg-success" :
                          order.status === "dikirim" ? "bg-primary" :
                          order.status === "selesai" ? "bg-secondary" : "bg-danger"
                        }`}>
                          {order.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>

                      {/* 1. INPUT ONGKIR */}
                      {order.status === "menunggu_ongkir" && (
                        <div className="d-grid gap-2">
                          <label className="form-label small fw-bold">Input Ongkir (Rp)</label>
                          <div className="input-group input-group-sm">
                            <input type="number" className="form-control" value={ongkirInputs[order.id] || ""} onChange={(e) => setOngkirInputs({...ongkirInputs, [order.id]: e.target.value})} placeholder="Cth: 15000" />
                            <button className="btn btn-success" onClick={() => handleUpdate(order.id, "menunggu_pembayaran", { ongkir: parseInt(ongkirInputs[order.id]), total_bayar: (order.subtotal_produk || 0) + parseInt(ongkirInputs[order.id]) })} disabled={isUpdating === order.id || !ongkirInputs[order.id]}>Kirim</button>
                          </div>
                        </div>
                      )}

                      {/* 2. KONFIRMASI BUKTI BAYAR */}
                      {order.status_bukti === "menunggu_konfirmasi" && (
                        <div className="d-grid gap-2 mb-2">
                          <button className="btn btn-success" onClick={() => handleUpdate(order.id, "lunas", { from_bukti: true })} disabled={isUpdating === order.id}>
                            <FaCheckCircle className="me-1" /> Setujui & Lunas
                          </button>
                          <button className="btn btn-danger" onClick={() => {
                            const catatan = prompt("Alasan penolakan (opsional):");
                            handleUpdate(order.id, "", { tolak_bukti: true, catatan: catatan || "" });
                          }} disabled={isUpdating === order.id}>
                            <FaTimesCircle className="me-1" /> Tolak Bukti
                          </button>
                        </div>
                      )}

                      {/* 3. UPLOAD BUKTI PENGIRIMAN (Setelah Lunas) */}
                      {order.status === "lunas" && !order.bukti_pengiriman_url && (
                        <div className="d-grid gap-2 mb-2">
                          <label className="form-label small fw-bold mb-0">📸 Upload Bukti Pengiriman</label>
                          <small className="text-muted">Screenshot dari Gojek/Grab/JNE atau foto barang sudah dikirim</small>
                          <DeliveryProofUpload
                            orderId={order.id}
                            onUploadComplete={(url) => handleDeliveryProofUpload(order.id, url)}
                            userId={user?.id || ""}
                          />
                        </div>
                      )}

                      {/* Show delivery proof if already uploaded */}
                      {order.bukti_pengiriman_url && order.status === "dikirim" && (
                        <div className="mb-2">
                          <label className="form-label small fw-bold">✅ Bukti Pengiriman</label>
                          <img
                            src={order.bukti_pengiriman_url}
                            alt="Bukti Pengiriman"
                            className="img-fluid rounded mb-2"
                            style={{ maxHeight: '200px', cursor: 'pointer' }}
                            onClick={() => {
                              setViewingProofUrl(order.bukti_pengiriman_url);
                              setShowProofViewer(true);
                            }}
                          />
                          <div className="alert alert-success small py-1 px-2 mb-0">
                            <FaCheckCircle className="me-1" /> Pesanan sedang dikirim
                          </div>
                        </div>
                      )}

                      {/* 4. PROSES SETELAH DIKIRIM */}
                      {order.status === "dikirim" && (
                        <div className="alert alert-info small py-2 mb-2">
                          <FaTruck className="me-1" /> Menunggu customer konfirmasi terima
                        </div>
                      )}

                      {order.status === "selesai" && (
                        <div className="alert alert-success small py-2 mb-2">
                          <FaCheckCircle className="me-1" /> Pesanan selesai - Dana masuk saldo
                        </div>
                      )}

                      <Link href={`/chat/order/${order.id}`} className="btn btn-outline-info btn-sm w-100 mt-2">
                        <FaComments className="me-1" /> Chat Customer
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Proof Viewer */}
      <PaymentProofViewer
        isOpen={showProofViewer}
        onClose={() => setShowProofViewer(false)}
        proofUrl={viewingProofUrl}
      />
    </section>
  );
}
