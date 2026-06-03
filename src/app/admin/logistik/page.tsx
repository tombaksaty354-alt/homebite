"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaTruck, FaMotorcycle, FaQrcode, FaCheckCircle,
  FaClock, FaMapMarkerAlt, FaSearch, FaSync
} from "react-icons/fa";

function getStatusInfo(status: string) {
  switch (status) {
    case "siap_dikirim": return { label: "Siap Dikirim", pill: "status-pill-pending", icon: "📦" };
    case "dijemput": return { label: "Dijemput Driver", pill: "status-pill-pickup", icon: "🏍️" };
    case "dikirim": return { label: "Sedang Dikirim", pill: "status-pill-delivery", icon: "🚚" };
    case "selesai": return { label: "Selesai", pill: "status-pill-done", icon: "✅" };
    default: return { label: status, pill: "status-pill-pending", icon: "📦" };
  }
}

export default function AdminLogistik() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logistics, setLogistics] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ ready: 0, pickup: 0, delivering: 0, completed: 0 });

  const fetchLogistics = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/logistics", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (result.success) {
        setLogistics(result.data || []);
        setStats(result.stats || { ready: 0, pickup: 0, delivering: 0, completed: 0 });
      }
    } catch (err) {
      console.error("Error fetching logistics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user?.role === "admin") {
      fetchLogistics();
    }
  }, [user, loading, router, fetchLogistics]);

  const filtered = logistics.filter((l: any) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (searchQuery && !(l.nomor_pesanan || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(l.mitra_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading || isLoading) return <div className="container py-5 text-center"><div className="searching-spinner mx-auto mb-3" /><p className="text-muted">Memuat logistik...</p></div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-4" style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
            <FaArrowLeft size={12} /> Kembali ke Dashboard
          </Link>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold">🚚 Logistics Gateway</h2>
              <p className="text-muted">Pantau alokasi driver dan status pengiriman real-time</p>
            </div>
            <button className="btn-action btn-action-primary" onClick={fetchLogistics}>
              <FaSync size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Pipeline */}
        <div className="row g-3 mb-4">
          {[
            { label: "Siap Dikirim", value: stats.ready, bg: "linear-gradient(135deg, #f39c12, #e67e22)", icon: "📦" },
            { label: "Dijemput", value: stats.pickup, bg: "linear-gradient(135deg, #3498db, #2980b9)", icon: "🏍️" },
            { label: "Sedang Dikirim", value: stats.delivering, bg: "linear-gradient(135deg, #8e44ad, #9b59b6)", icon: "🚚" },
            { label: "Selesai", value: stats.completed, bg: "linear-gradient(135deg, #27ae60, #2ecc71)", icon: "✅" },
          ].map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="stat-card" style={{ background: s.bg }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card-glass p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white"><FaSearch className="text-muted" /></span>
                <input type="text" className="form-control" placeholder="Cari pesanan atau mitra..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="siap_dikirim">📦 Siap Dikirim</option>
                <option value="dijemput">🏍️ Dijemput</option>
                <option value="dikirim">🚚 Dikirim</option>
                <option value="selesai">✅ Selesai</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logistics Table */}
        <div className="table-responsive">
          <table className="table table-premium">
            <thead>
              <tr>
                <th>No. Pesanan</th>
                <th>Mitra</th>
                <th>Customer</th>
                <th>Driver</th>
                <th>Status</th>
                <th>QR Scan</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-4 text-muted">Tidak ada data logistik</td></tr>
              ) : (
                filtered.map((l) => {
                  const statusInfo = getStatusInfo(l.status);
                  return (
                    <tr key={l.id}>
                      <td className="fw-bold" style={{ color: "#e67e22" }}>{l.nomor_pesanan}</td>
                      <td>{l.mitra_name}</td>
                      <td>{l.customer_name}</td>
                      <td>
                        {l.driver_name ? (
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 13 }}>{l.driver_name}</div>
                            <small className="text-muted">{l.driver_vehicle} • {l.driver_plate}</small>
                          </div>
                        ) : (
                          <span className="text-muted fst-italic" style={{ fontSize: 13 }}>Belum dialokasikan</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${statusInfo.pill}`}>
                          {statusInfo.icon} {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        {l.qr_scanned ? (
                          <div>
                            <FaCheckCircle className="text-success me-1" />
                            <small className="text-success fw-semibold">Tervalidasi</small>
                            {l.qr_scanned_at && (
                              <div><small className="text-muted">{new Date(l.qr_scanned_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</small></div>
                            )}
                          </div>
                        ) : (
                          <small className="text-muted">-</small>
                        )}
                      </td>
                      <td>
                        {l.eta !== null && l.eta > 0 ? (
                          <span className="fw-bold" style={{ color: "#e67e22" }}>{l.eta} min</span>
                        ) : l.status === "selesai" ? (
                          <FaCheckCircle className="text-success" />
                        ) : (
                          <small className="text-muted">-</small>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* QR Scan Log */}
        <div className="card-glass p-4 mt-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <FaQrcode style={{ color: "#e67e22" }} /> Log Pemindaian QR Code
          </h5>
          <div className="d-flex flex-column gap-2">
            {logistics.filter((l) => l.qr_scanned).map((l) => (
              <div key={l.id} className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: "#f8f9fa" }}>
                <FaCheckCircle className="text-success flex-shrink-0" />
                <div className="flex-grow-1">
                  <span className="fw-semibold" style={{ fontSize: 13 }}>{l.nomor_pesanan}</span>
                  <span className="text-muted mx-1">•</span>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    QR dipindai oleh <strong>{l.driver_name}</strong> di lokasi <strong>{l.mitra_name}</strong>
                  </span>
                </div>
                <small className="text-muted">
                  {l.qr_scanned_at && new Date(l.qr_scanned_at).toLocaleString("id-ID")}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
