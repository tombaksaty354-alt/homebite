"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaStar, FaComments, FaShoppingBag, FaCreditCard, FaQrcode, FaUpload, FaCheckCircle, FaTimesCircle, FaClock, FaImage, FaCheck, FaMapMarkerAlt } from "react-icons/fa";
import OrderTimeline from "@/components/OrderTimeline";
import PaymentProofUpload from "@/components/PaymentProofUpload";
import PaymentProofViewer from "@/components/PaymentProofViewer";
import ConfirmOrderButton from "@/components/ConfirmOrderButton";

export default function CustomerPesanan() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [payModal, setPayModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [payMethod, setPayMethod] = useState("transfer");
  const [platformRekeningList, setPlatformRekeningList] = useState<any[]>([]);
  const [selectedRekeningId, setSelectedRekeningId] = useState<string>("");
  const [payProofUrl, setPayProofUrl] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState("");

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, komentar: "" });
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedCancelOrder, setSelectedCancelOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else fetchOrders();
    }
  }, [user, loading, router]);

  async function fetchOrders() {
    if (!supabase || !user || !user.id) return;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error("Error fetching orders:", error);
    if (data) setOrders(data);
  }

  async function openPayModal(order: any) {
    setSelectedOrder(order);
    setPayMethod("transfer");
    setPayProofUrl("");
    setSelectedRekeningId("");
    setPayModal(true);

    // Fetch platform rekening (rekening tujuan Escrow)
    if (supabase) {
      const { data, error } = await supabase
        .from("platform_rekening")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPlatformRekeningList(data);
        // Auto-select first active rekening
        if (data.length > 0) {
          setSelectedRekeningId(data[0].id);
        }
      } else {
        setPlatformRekeningList([]);
      }
    }
  }

  async function handleUploadProof() {
    if (!supabase) return;
    if (!selectedOrder) {
      alert("⚠️ Pesanan tidak valid atau belum dipilih.");
      return;
    }
    if (!selectedRekeningId) {
      alert("⚠️ Silakan pilih rekening tujuan transfer terlebih dahulu.");
      return;
    }
    if (!payProofUrl) {
      alert("⚠️ Bukti transfer WAJIB diupload untuk memproses pembayaran. Silakan pilih file dan tunggu hingga proses upload selesai.");
      return;
    }

    setIsPaying(true);
    try {
      const selectedRek = platformRekeningList.find((r: any) => r.id === selectedRekeningId);
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/orders/payment-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          buktiPembayaran: payProofUrl,
          metodePembayaran: payMethod,
          pembayaranMetode: selectedRek ? `${selectedRek.bank} - ${selectedRek.nomor}` : payMethod,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Gagal mengirim bukti');

      alert("✅ Bukti pembayaran terkirim! Tunggu konfirmasi platform.");
      setPayModal(false);
      fetchOrders();
    } catch (error: any) {
      alert("Gagal: " + error.message);
    } finally {
      setIsPaying(false);
    }
  }

  async function submitReview() {
    if (!supabase || !user || !selectedReviewOrder) return;
    try {
      const { data: items } = await supabase
        .from("order_items")
        .select("produk_id")
        .eq("order_id", selectedReviewOrder.id);

      if (!items || items.length === 0) {
        alert("Tidak ada item untuk direview");
        return;
      }

      let successCount = 0;
      let conflictCount = 0;

      // Submit review untuk setiap item
      for (const item of items) {
        const { error } = await supabase.from("reviews").insert({
          customer_id: user.id,
          produk_id: item.produk_id,
          order_id: selectedReviewOrder.id,
          rating: reviewData.rating,
          komentar: reviewData.komentar,
        });

        if (!error) {
          successCount++;
        } else if (error.code === '23505' || error.message?.includes('duplicate')) {
          // Unique constraint violation - review sudah ada
          conflictCount++;
          console.log(`Review untuk produk ${item.produk_id} sudah ada, dilewati`);
        } else {
          console.error("Error submitting review:", error);
        }
      }

      // Show result
      if (successCount > 0 && conflictCount === 0) {
        alert(`✅ ${successCount} review berhasil dikirim!`);
        setReviewModal(false);
        fetchOrders();
      } else if (successCount > 0 && conflictCount > 0) {
        alert(`✅ ${successCount} review dikirim, ${conflictCount} review sudah ada sebelumnya.`);
        setReviewModal(false);
        fetchOrders();
      } else if (conflictCount > 0) {
        alert("⚠️ Review untuk pesanan ini sudah pernah dikirim sebelumnya.");
        setReviewModal(false);
        fetchOrders();
      } else {
        alert("❌ Gagal mengirim review. Silakan coba lagi.");
      }
    } catch (error: any) {
      alert("Gagal mengirim review: " + error.message);
    }
  }

  async function handleCancelOrder() {
    if (!supabase || !user || !selectedCancelOrder || !cancelReason.trim()) return;
    setIsCancelling(true);

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "dibatalkan",
          alasan_batal: cancelReason.trim(),
          dibatalkan_oleh: user.id,
          tanggal_batal: new Date().toISOString(),
          // Trigger akan auto-set refund_status, refund_amount, canceled_at
        })
        .eq("id", selectedCancelOrder.id);

      if (error) throw error;

      // Notification ke mitra akan dihandle oleh trigger database
      // Tidak perlu insert manual lagi

      alert("✅ Pesanan berhasil dibatalkan");
      setCancelModal(false);
      setCancelReason("");
      fetchOrders();
    } catch (error: any) {
      alert("Gagal membatalkan pesanan: " + error.message);
    } finally {
      setIsCancelling(false);
    }
  }

  function formatRupiah(angka: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  }

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) return null;

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <Link href="/" className="btn btn-outline-secondary btn-sm mb-2">
            <FaArrowLeft className="me-1" /> Kembali
          </Link>
          <h2 className="fw-bold">Riwayat Pesanan</h2>
        </div>

        {orders.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaShoppingBag size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Belum ada pesanan</h5>
            <Link href="/produk" className="btn text-white mt-3" style={{ backgroundColor: "#e67e22" }}>Mulai Belanja</Link>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h5 className="fw-bold mb-1">{order.nomor_pesanan}</h5>
                    <p className="text-muted small mb-2">{new Date(order.created_at).toLocaleString("id-ID")}</p>
                    
                    {/* Rincian Biaya */}
                    <div className="bg-light p-3 rounded-3 small mt-2 mb-3 border border-light" style={{ maxWidth: "320px" }}>
                      <div className="d-flex justify-content-between mb-1 text-muted">
                        <span>Subtotal Produk:</span>
                        <span>{formatRupiah(order.subtotal_produk)}</span>
                      </div>
                      {order.ongkir > 0 && (
                        <div className="d-flex justify-content-between mb-1 text-muted">
                          <span>Ongkos Kirim:</span>
                          <span className="text-success fw-medium">{formatRupiah(order.ongkir)}</span>
                        </div>
                      )}
                      {order.jasa_website > 0 && (
                        <div className="d-flex justify-content-between mb-1 text-muted">
                          <span>Jasa Platform:</span>
                          <span>{formatRupiah(order.jasa_website)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between pt-2 mt-2 border-top fw-bold text-dark fs-6">
                        <span>Total Bayar:</span>
                        <span style={{ color: "#e67e22" }}>{formatRupiah(order.total_bayar || order.subtotal_produk)}</span>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="mt-3 mb-2">
                      <OrderTimeline status={order.status} compact />
                    </div>
                    
                    {/* Status Alerts */}
                    {order.status === "menunggu_ongkir" && (
                      <div className="alert alert-warning small mt-2 py-2">
                        <FaClock className="me-1" /> Menunggu Admin menentukan ongkir & platform fee.
                      </div>
                    )}
                    {order.status_bukti === "menunggu_konfirmasi" && (
                      <div className="alert alert-warning small mt-2 py-2">
                        <FaClock className="me-1" /> Menunggu Konfirmasi Platform
                      </div>
                    )}
                    {/* Notifikasi Bukti Diterima (Hanya muncul sebelum Lunas/Dikirim/Selesai) */}
                    {order.status_bukti === "disetujui" && !["lunas", "dikirim", "selesai"].includes(order.status) && (
                      <div className="alert alert-info small mt-2 py-2">
                        <FaCheckCircle className="me-1" /> Bukti Diterima. Menunggu Pemrosesan.
                      </div>
                    )}
                    {order.status === "lunas" && (
                      <div className="alert alert-success small mt-2 py-2">
                        <FaCheckCircle className="me-1" /> Pembayaran Dikonfirmasi - {order.metode_pembayaran}
                      </div>
                    )}
                    {order.status_bukti === "ditolak" && (
                      <div className="alert alert-danger small mt-2 py-2">
                        <FaTimesCircle className="me-1" /> Bukti Ditolak: {order.catatan_penolakan || "Tidak jelas"}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 d-flex flex-column gap-2">
                    <span className={`badge d-block text-center py-2 ${
                      order.status === "menunggu_ongkir" ? "bg-warning text-dark" :
                      order.status === "menunggu_pembayaran" ? "bg-info" :
                      order.status === "lunas" ? "bg-success" :
                      order.status === "dikirim" ? "bg-primary" :
                      order.status === "selesai" ? "bg-secondary" : "bg-danger"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>

                    {/* Tombol Kirim Bukti Bayar */}
                    {(order.status === "menunggu_pembayaran" || order.status_bukti === "menunggu_konfirmasi") && order.status_bukti !== "disetujui" && order.status !== "lunas" && (
                      <button className="btn btn-primary w-100" onClick={() => openPayModal(order)}>
                        <FaUpload className="me-2" /> {order.status_bukti === "menunggu_konfirmasi" ? "Lihat Bukti Bayar" : "Kirim Bukti Bayar"}
                      </button>
                    )}

                    {/* Tombol Lihat Bukti Bayar (jika sudah ada bukti) */}
                    {order.bukti_pembayaran && (
                      <button 
                        className="btn btn-outline-secondary w-100 btn-sm" 
                        onClick={() => {
                          setViewingProofUrl(order.bukti_pembayaran);
                          setShowProofViewer(true);
                        }}
                      >
                        <FaImage className="me-1" /> Lihat Bukti
                      </button>
                    )}

                    {/* Tombol Batalkan Pesanan */}
                    {(order.status === "menunggu_ongkir" || (order.status === "menunggu_pembayaran" && order.status_bukti !== "disetujui")) && order.status !== "dibatalkan" && (
                      <button className="btn btn-outline-danger w-100 mt-2" onClick={() => { setSelectedCancelOrder(order); setCancelReason(""); setCancelModal(true); }}>
                        ❌ Batalkan Pesanan
                      </button>
                    )}

                    {/* Tombol Lacak Pesanan */}
                    {order.status === "dikirim" && (
                      <Link href={`/pelacakan?order=${order.id}`} className="btn-action btn-action-info w-100 justify-content-center" style={{ textDecoration: 'none' }}>
                        <FaMapMarkerAlt size={14} /> Lacak Pesanan
                      </Link>
                    )}

                    {/* Tombol Terima Pesanan - RE-ENABLED */}
                    {order.status === "dikirim" && (
                      <div className="mb-2">
                        {order.bukti_pengiriman_url && (
                          <div className="mb-2">
                            <label className="form-label small fw-bold mb-1 text-success">✅ Bukti Pengiriman dari Mitra</label>
                            <img
                              src={order.bukti_pengiriman_url}
                              alt="Bukti Pengiriman"
                              className="img-fluid rounded mb-2 border border-success"
                              style={{ maxHeight: '150px', cursor: 'pointer' }}
                              onClick={() => {
                                setViewingProofUrl(order.bukti_pengiriman_url);
                                setShowProofViewer(true);
                              }}
                            />
                          </div>
                        )}
                        <ConfirmOrderButton
                          orderId={order.id}
                          orderNumber={order.nomor_pesanan}
                          onConfirm={() => {
                            // Refresh orders after confirmation
                            fetchOrders();
                          }}
                        />
                      </div>
                    )}

                    {/* Tombol Review */}
                    {order.status === "selesai" && (
                      <button className="btn btn-warning w-100" onClick={() => { setSelectedReviewOrder(order); setReviewModal(true); }}>
                        <FaStar className="me-2" /> Beri Review
                      </button>
                    )}

                    {/* Chat Mitra */}
                    <Link href={`/chat/order/${order.id}`} className="btn btn-outline-info w-100">
                      <FaComments className="me-2" /> Chat Mitra
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Modal Kirim Bukti Bayar */}
        {payModal && selectedOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Kirim Bukti Pembayaran</h5>
                  <button type="button" className="btn-close" onClick={() => setPayModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-info small mb-3">
                    <strong>ℹ️ Rekening Bersama (Escrow):</strong> Transfer ke rekening platform di bawah ini. 
                    Dana akan ditahan oleh platform sampai pesanan selesai, kemudian diteruskan ke mitra.
                  </div>

                  <h6 className="fw-bold mb-3"><FaCreditCard className="me-2" /> Rekening Tujuan Transfer</h6>

                  {platformRekeningList.length === 0 ? (
                    <div className="alert alert-danger">
                      <FaTimesCircle className="me-2" />
                      <span className="text-danger">Belum ada rekening platform. Harap hubungi admin.</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted small mb-3">
                        💡 Pilih rekening platform untuk transfer. Semua rekening aktif tersedia.
                      </p>

                      <div className="row mb-4">
                        {platformRekeningList.map((rek: any) => (
                          <div key={rek.id} className="col-md-6 mb-3">
                            <div
                              className={`card h-100 ${selectedRekeningId === rek.id ? 'border-success border-2' : ''}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedRekeningId(rek.id)}
                            >
                              <div className="card-body">
                                <div className="d-flex align-items-center mb-2">
                                  {selectedRekeningId === rek.id ? (
                                    <FaCheckCircle className="text-success me-2" />
                                  ) : (
                                    <div className="me-2" style={{ width: '20px' }}></div>
                                  )}
                                  <h6 className="fw-bold mb-0">{rek.bank}</h6>
                                </div>
                                <p className="mb-1">
                                  <small className="text-muted">No. Rekening:</small><br/>
                                  <span className="fw-bold fs-5">{rek.nomor}</span>
                                </p>
                                <p className="mb-0">
                                  <small className="text-muted">Atas Nama:</small><br/>
                                  <strong>{rek.atas_nama}</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="alert alert-warning small mb-3">
                    <strong>⚠️ Penting:</strong> Pastikan transfer sesuai nominal yang tertera. 
                    Setelah transfer, upload bukti pembayaran di bawah ini.
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Metode Pembayaran</label>
                    <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                      <option value="transfer">Transfer Bank</option>
                      <option value="qris">QRIS (E-Wallet)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Bukti Transfer <span className="text-danger">*</span>
                    </label>
                    <PaymentProofUpload
                      onUploadComplete={(url) => setPayProofUrl(url)}
                      currentProofUrl={payProofUrl}
                      isRequired={true}
                      disabled={!user?.id}
                      userId={user?.id || ""}
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      className="btn btn-success"
                      onClick={handleUploadProof}
                      disabled={isPaying}
                    >
                      {isPaying ? "Mengirim..." : "Kirim Bukti Bayar"}
                    </button>
                  </div>
                </div>
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

        {/* Modal Review */}
        {reviewModal && selectedReviewOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Beri Review</h5>
                  <button type="button" className="btn-close" onClick={() => setReviewModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3 text-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FaStar key={star} size={32} className={star <= reviewData.rating ? "text-warning" : "text-muted"} style={{ cursor: "pointer" }} onClick={() => setReviewData({ ...reviewData, rating: star })} />
                    ))}
                  </div>
                  <textarea className="form-control mb-3" rows={3} placeholder="Bagaimana pengalaman Anda?" value={reviewData.komentar} onChange={e => setReviewData({ ...reviewData, komentar: e.target.value })}></textarea>
                  <button className="btn btn-success w-100" onClick={submitReview}>Kirim Review</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Batalkan Pesanan */}
        {cancelModal && selectedCancelOrder && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Batalkan Pesanan</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setCancelModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning small">
                    <strong>Pesanan:</strong> {selectedCancelOrder.nomor_pesanan}<br/>
                    <strong>Total:</strong> {formatRupiah(selectedCancelOrder.total_bayar || selectedCancelOrder.subtotal_produk)}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Alasan Pembatalan</label>
                    <select className="form-select mb-2" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
                      <option value="">-- Pilih Alasan --</option>
                      <option value="Mitra terlalu lama menentukan ongkir">Mitra terlalu lama menentukan ongkir</option>
                      <option value="Ongkir terlalu mahal">Ongkir terlalu mahal</option>
                      <option value="Tidak sengaja pesan">Tidak sengaja pesan</option>
                      <option value="Produk tidak tersedia">Produk tidak tersedia</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    {cancelReason === "Lainnya" && (
                      <textarea className="form-control" rows={2} placeholder="Tulis alasan pembatalan..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}></textarea>
                    )}
                  </div>
                  <button className="btn btn-danger w-100" onClick={handleCancelOrder} disabled={isCancelling || !cancelReason.trim()}>
                    {isCancelling ? "Membatalkan..." : "Ya, Batalkan Pesanan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
