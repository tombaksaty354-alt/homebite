"use client";

import { useState, useEffect } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaTruck, FaCoins, FaCalculator, FaClock, FaCheckCircle, FaUser, FaStore, FaMapMarkerAlt, FaSearch } from "react-icons/fa";

export default function AdminAturOngkirPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    processedCount: 0,
  });
  const [filterTab, setFilterTab] = useState("pending"); // pending | processed
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [ongkir, setOngkir] = useState<string>("0");
  const [jasaWebsite, setJasaWebsite] = useState<string>("5000"); // default platform fee Rp 5.000
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "admin") router.push("/");
      else {
        fetchOrders();
        
        // Auto refresh every 30 seconds
        const interval = setInterval(() => {
          fetchOrders();
          setLastRefresh(new Date());
        }, 30000);
        
        return () => clearInterval(interval);
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchOrders();
    }
  }, [filterTab]);

  async function fetchOrders() {
    if (!supabase) return;

    try {
      // Get count statistics
      const { data: countPending, error: pendingErr } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("status", "menunggu_ongkir");

      const { data: countProcessed, error: processedErr } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .neq("status", "menunggu_ongkir");

      if (!pendingErr && countPending) {
        setStats(prev => ({ ...prev, pendingCount: countPending.length }));
      }
      if (!processedErr && countProcessed) {
        setStats(prev => ({ ...prev, processedCount: countProcessed.length }));
      }

      // Fetch actual orders for display
      let query = supabase
        .from("orders")
        .select("*, customer:users!customer_id(nama, telepon, kota, alamat), mitra:users!mitra_id(nama, telepon, kota, alamat)")
        .order("created_at", { ascending: false });

      if (filterTab === "pending") {
        query = query.eq("status", "menunggu_ongkir");
      } else {
        query = query.neq("status", "menunggu_ongkir");
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }

  function handleOpenForm(order: any) {
    setSelectedOrder(order);
    setOngkir("0");
    setJasaWebsite("5000"); // default
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !selectedOrder) return;

    const ongkirNum = parseInt(ongkir, 10);
    const jasaWebsiteNum = parseInt(jasaWebsite, 10);

    if (isNaN(ongkirNum) || ongkirNum < 0) {
      alert("⚠️ Ongkos kirim harus berupa angka positif!");
      return;
    }

    if (isNaN(jasaWebsiteNum) || jasaWebsiteNum < 0) {
      alert("⚠️ Jasa website harus berupa angka positif!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch("/api/admin/set-ongkir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          ongkir: ongkirNum,
          jasaWebsite: jasaWebsiteNum,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengatur ongkos kirim");
      }

      alert("✅ Ongkos kirim & Jasa Website berhasil ditetapkan!");
      setShowModal(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Error setting ongkir:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(o => {
    const term = searchQuery.toLowerCase();
    return (
      o.nomor_pesanan.toLowerCase().includes(term) ||
      (o.customer?.nama && o.customer.nama.toLowerCase().includes(term)) ||
      (o.mitra?.nama && o.mitra.nama.toLowerCase().includes(term))
    );
  });

  const liveTotal = selectedOrder
    ? (selectedOrder.subtotal_produk || 0) + (parseInt(ongkir, 10) || 0) + (parseInt(jasaWebsite, 10) || 0)
    : 0;

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-5 bg-light min-vh-100">
      <div className="container">
        {/* Back Link */}
        <div className="mb-4">
          <Link href="/admin" className="text-decoration-none text-muted d-inline-flex align-items-center gap-2 hover-primary transition">
            <FaArrowLeft /> Kembali ke Dashboard
          </Link>
        </div>

        {/* Header Section */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                🚚 Atur Ongkir & Jasa Platform
              </h2>
              <p className="text-muted mb-0">
                Tentukan ongkos kirim dan biaya jasa website untuk pesanan yang masuk sebelum dibayar customer.
              </p>
            </div>
            <div className="text-end">
              <div className="small text-muted mb-2">
                🕐 Last refresh: {lastRefresh.toLocaleTimeString('id-ID')}
              </div>
              <button 
                className="btn btn-sm btn-outline-primary transition hover-up"
                onClick={() => {
                  fetchOrders();
                  setLastRefresh(new Date());
                }}
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className="card border-0 shadow-sm bg-warning bg-opacity-10 border-start border-warning border-4 h-100">
              <div className="card-body d-flex align-items-center justify-content-between p-4">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase fw-semibold small">Menunggu Ongkos Kirim</h6>
                  <h3 className="fw-bold mb-0 text-warning">{stats.pendingCount} Pesanan</h3>
                </div>
                <FaClock className="text-warning opacity-50" size={40} />
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card border-0 shadow-sm bg-success bg-opacity-10 border-start border-success border-4 h-100">
              <div className="card-body d-flex align-items-center justify-content-between p-4">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase fw-semibold small">Sudah Diproses</h6>
                  <h3 className="fw-bold mb-0 text-success">{stats.processedCount} Pesanan</h3>
                </div>
                <FaCheckCircle className="text-success opacity-50" size={40} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab & Search controls */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="btn-group" role="group">
                <button
                  className={`btn btn-sm px-4 ${filterTab === 'pending' ? 'btn-warning text-dark fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterTab("pending")}
                >
                  ⏳ Menunggu Ongkir ({stats.pendingCount})
                </button>
                <button
                  className={`btn btn-sm px-4 ${filterTab === 'processed' ? 'btn-success text-white fw-semibold' : 'btn-outline-secondary'}`}
                  onClick={() => setFilterTab("processed")}
                >
                  ✅ Sudah Diproses ({stats.processedCount})
                </button>
              </div>

              {/* Search bar */}
              <div className="position-relative" style={{ minWidth: "280px" }}>
                <input
                  type="text"
                  className="form-control form-control-sm ps-5"
                  placeholder="Cari nomor pesanan, customer, mitra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FaSearch className="position-absolute text-muted" style={{ left: "15px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted fs-5 mb-0">Tidak ada pesanan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-muted uppercase font-semibold small">
                    <tr>
                      <th className="px-4 py-3">No. Pesanan</th>
                      <th className="py-3">Customer (Tujuan)</th>
                      <th className="py-3">Mitra (Asal)</th>
                      <th className="py-3">Subtotal Produk</th>
                      {filterTab === "processed" && (
                        <>
                          <th className="py-3">Ongkir</th>
                          <th className="py-3">Jasa Website</th>
                        </>
                      )}
                      <th className="py-3">Status</th>
                      <th className="px-4 py-3 text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="transition border-bottom border-light">
                        <td className="px-4 py-3 fw-bold text-dark">{o.nomor_pesanan}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <FaUser className="text-muted small" />
                            <div>
                              <div className="fw-semibold text-dark">{o.customer?.nama || "Customer"}</div>
                              <small className="text-muted">{o.customer?.kota || o.kota || "N/A"}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <FaStore className="text-muted small" />
                            <div>
                              <div className="fw-semibold text-dark">{o.mitra?.nama || "Mitra"}</div>
                              <small className="text-muted">{o.mitra?.kota || "N/A"}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 fw-medium text-dark">{formatRupiah(o.subtotal_produk || 0)}</td>
                        {filterTab === "processed" && (
                          <>
                            <td className="py-3 text-success fw-medium">{formatRupiah(o.ongkir || 0)}</td>
                            <td className="py-3 text-primary fw-medium">{formatRupiah(o.jasa_website || 0)}</td>
                          </>
                        )}
                        <td className="py-3">
                          <span className={`badge ${
                            o.status === 'menunggu_ongkir' ? 'bg-warning text-dark' :
                            o.status === 'menunggu_pembayaran' ? 'bg-info' :
                            o.status === 'lunas' ? 'bg-success' : 'bg-secondary'
                          } px-3 py-2 rounded-pill font-medium`}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {o.status === "menunggu_ongkir" ? (
                            <button
                              className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold shadow-sm transition hover-up"
                              onClick={() => handleOpenForm(o)}
                            >
                              🚚 Tentukan Ongkir
                            </button>
                          ) : (
                            <span className="text-muted small fw-medium">Selesai di-set</span>
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

        {/* Setup Modal */}
        {showModal && selectedOrder && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                    🚚 Tentukan Ongkos Kirim
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body p-4">
                    {/* Order summary */}
                    <div className="bg-light rounded p-3 mb-4">
                      <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                        <span className="text-muted small">No. Pesanan:</span>
                        <span className="fw-bold text-dark small">{selectedOrder.nomor_pesanan}</span>
                      </div>
                      <div className="mb-2">
                        <strong className="text-dark small d-flex align-items-center gap-1"><FaStore className="text-muted" /> Dari (Mitra):</strong>
                        <div className="ps-3 text-muted small">{selectedOrder.mitra?.nama} ({selectedOrder.mitra?.kota})</div>
                        <div className="ps-3 text-muted small">{selectedOrder.mitra?.alamat || "Alamat Mitra"}</div>
                      </div>
                      <div className="mb-2">
                        <strong className="text-dark small d-flex align-items-center gap-1"><FaUser className="text-muted" /> Ke (Customer):</strong>
                        <div className="ps-3 text-muted small">{selectedOrder.customer?.nama} ({selectedOrder.customer?.kota})</div>
                        <div className="ps-3 text-muted small">{selectedOrder.alamat_lengkap}, {selectedOrder.kota}, {selectedOrder.provinsi} {selectedOrder.kode_pos}</div>
                      </div>
                      <div className="d-flex justify-content-between pt-2 border-top">
                        <span className="text-muted small">Subtotal Produk:</span>
                        <span className="fw-bold text-dark">{formatRupiah(selectedOrder.subtotal_produk)}</span>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-1">
                        <FaTruck size={14} className="text-primary" /> Ongkos Kirim (Rp)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Masukkan tarif ongkos kirim..."
                        value={ongkir}
                        onChange={(e) => setOngkir(e.target.value)}
                        required
                        min="0"
                      />
                      <small className="text-muted">Masukkan nilai 0 jika gratis ongkir.</small>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-1">
                        <FaCoins size={14} className="text-warning" /> Jasa Website / Platform Fee (Rp)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Masukkan jasa platform..."
                        value={jasaWebsite}
                        onChange={(e) => setJasaWebsite(e.target.value)}
                        required
                        min="0"
                      />
                      <small className="text-muted">Nominal tetap yang akan masuk ke kas platform Homebite.</small>
                    </div>

                    {/* Total Calculator */}
                    <div className="border-top pt-3 mt-3 bg-primary bg-opacity-10 rounded p-3 border-start border-primary border-3">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-1">
                            <FaCalculator size={14} /> Total Pembayaran
                          </h6>
                          <small className="text-muted">Produk + Ongkir + Jasa</small>
                        </div>
                        <div className="text-end">
                          <h4 className="fw-bold text-primary mb-0">{formatRupiah(liveTotal)}</h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold" disabled={isSubmitting}>
                      {isSubmitting ? "Memproses..." : "Konfirmasi & Kirim"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
