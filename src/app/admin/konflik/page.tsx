"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaExclamationTriangle, FaMoneyBillWave, FaComments,
  FaEye, FaCheck, FaTimes, FaUser, FaStore, FaMotorcycle,
  FaCalendarAlt, FaSearch, FaUndo
} from "react-icons/fa";

function getTypeInfo(type: string) {
  switch (type) {
    case "produk_rusak": return { label: "Produk Rusak", icon: "📦", color: "#e74c3c" };
    case "driver_cancel": return { label: "Driver Cancel", icon: "🏍️", color: "#8e44ad" };
    case "pesanan_salah": return { label: "Pesanan Salah", icon: "❌", color: "#f39c12" };
    case "terlambat": return { label: "Terlambat", icon: "🕐", color: "#3498db" };
    default: return { label: type, icon: "⚠️", color: "#95a5a6" };
  }
}

function getPriorityInfo(priority: string) {
  switch (priority) {
    case "critical": return { label: "Kritis", bg: "#fce4ec", color: "#c62828" };
    case "high": return { label: "Tinggi", bg: "#fff3e0", color: "#e65100" };
    case "medium": return { label: "Sedang", bg: "#e3f2fd", color: "#1565c0" };
    case "low": return { label: "Rendah", bg: "#e8f5e9", color: "#2e7d32" };
    default: return { label: priority, bg: "#f5f5f5", color: "#666" };
  }
}

export default function AdminKonflik() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [refundModal, setRefundModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ open: 0, investigating: 0, resolved: 0, totalRefund: 0 });

  const fetchConflicts = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/conflicts", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (result.success) {
        setConflicts(result.data || []);
        setStats(result.stats || { open: 0, investigating: 0, resolved: 0, totalRefund: 0 });
      }
    } catch (err) {
      console.error("Error fetching conflicts:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user?.role === "admin") {
      fetchConflicts();
    }
  }, [user, loading, router, fetchConflicts]);

  async function handleAction(id: string, action: string, resolution?: string) {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/conflicts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conflictId: id, action, resolution }),
      });
      const result = await res.json();
      if (result.success) {
        // Refresh data
        await fetchConflicts();
        setRefundModal(false);
        setSelectedConflict(null);
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
  }

  const filtered = conflicts.filter((c: any) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery && !(c.nomor_pesanan || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(c.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading || isLoading) return <div className="container py-5 text-center"><div className="searching-spinner mx-auto mb-3" /><p className="text-muted">Memuat konflik...</p></div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-4" style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
            <FaArrowLeft size={12} /> Kembali ke Dashboard
          </Link>
          <h2 className="fw-bold">⚖️ Portal Resolusi Konflik</h2>
          <p className="text-muted">Mediasi keluhan, tangani kendala operasional, dan proses refund</p>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Keluhan Terbuka", value: stats.open, bg: "linear-gradient(135deg, #e74c3c, #c0392b)", icon: FaExclamationTriangle },
            { label: "Investigasi", value: stats.investigating, bg: "linear-gradient(135deg, #f39c12, #e67e22)", icon: FaEye },
            { label: "Terselesaikan", value: stats.resolved, bg: "linear-gradient(135deg, #27ae60, #2ecc71)", icon: FaCheck },
            { label: "Total Refund", value: formatRupiah(stats.totalRefund), bg: "linear-gradient(135deg, #8e44ad, #9b59b6)", icon: FaMoneyBillWave },
          ].map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="stat-card" style={{ background: s.bg }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="stat-value" style={{ fontSize: typeof s.value === "string" ? 18 : 28 }}>{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                  <s.icon size={24} style={{ opacity: 0.5 }} />
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
                <input type="text" className="form-control" placeholder="Cari pesanan atau customer..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="open">🔴 Terbuka</option>
                <option value="investigating">🟡 Investigasi</option>
                <option value="resolved">🟢 Terselesaikan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Conflicts List */}
        <div className="d-flex flex-column gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaExclamationTriangle size={48} className="mb-3" style={{ opacity: 0.3 }} />
              <h5>Tidak ada keluhan ditemukan</h5>
            </div>
          ) : (
            filtered.map((conflict) => {
              const typeInfo = getTypeInfo(conflict.type);
              const priorityInfo = getPriorityInfo(conflict.priority);
              return (
                <div key={conflict.id} className="card-glass p-4 animate-fade-in"
                  style={{ borderLeft: `4px solid ${typeInfo.color}` }}>
                  <div className="row">
                    <div className="col-md-8">
                      {/* Header Row */}
                      <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                        <span className="fw-bold" style={{ color: "#e67e22", fontSize: 14 }}>{conflict.nomor_pesanan}</span>
                        <span className="status-pill" style={{ background: priorityInfo.bg, color: priorityInfo.color, fontSize: 11 }}>
                          {priorityInfo.label}
                        </span>
                        <span className="status-pill" style={{ background: `${typeInfo.color}15`, color: typeInfo.color, fontSize: 11 }}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      </div>

                      {/* People */}
                      <div className="d-flex gap-4 mb-2" style={{ fontSize: 13 }}>
                        <span className="d-flex align-items-center gap-1">
                          <FaUser size={11} className="text-muted" /> {conflict.customer_name}
                        </span>
                        <span className="d-flex align-items-center gap-1">
                          <FaStore size={11} className="text-muted" /> {conflict.mitra_name}
                        </span>
                      </div>

                      {/* Message */}
                      <div className="p-3 rounded-3 mb-2" style={{ background: "#f8f9fa", fontSize: 14 }}>
                        <FaComments className="text-muted me-2" size={12} />
                        &ldquo;{conflict.message}&rdquo;
                      </div>

                      {/* Resolution */}
                      {conflict.status === "resolved" && (conflict as any).resolution && (
                        <div className="alert alert-success small py-2 mb-0 d-flex align-items-center gap-2">
                          <FaCheck /> <strong>Resolusi:</strong> {(conflict as any).resolution}
                        </div>
                      )}

                      <div className="mt-2">
                        <small className="text-muted d-flex align-items-center gap-1">
                          <FaCalendarAlt size={10} />
                          {new Date(conflict.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="d-flex flex-column gap-2 align-items-end h-100 justify-content-center">
                        {/* Amount */}
                        <div className="fw-bold mb-2" style={{ fontSize: 18, color: "#2c3e50" }}>
                          {formatRupiah(conflict.total_bayar)}
                        </div>

                        {/* Status Badge */}
                        <span className={`status-pill ${
                          conflict.status === "open" ? "status-pill-cancel" :
                          conflict.status === "investigating" ? "status-pill-pending" :
                          "status-pill-done"
                        }`}>
                          {conflict.status === "open" ? "🔴 Terbuka" :
                           conflict.status === "investigating" ? "🟡 Investigasi" :
                           "🟢 Terselesaikan"}
                        </span>

                        {/* Actions */}
                        {conflict.status === "open" && (
                          <div className="d-flex gap-2 mt-2">
                            <button className="btn-action btn-action-info" style={{ fontSize: 12 }}
                              onClick={() => handleAction(conflict.id, 'investigate')}>
                              <FaEye size={11} /> Investigasi
                            </button>
                            <button className="btn-action btn-action-danger" style={{ fontSize: 12 }}
                              onClick={() => { setSelectedConflict(conflict); setRefundModal(true); }}>
                              <FaUndo size={11} /> Refund
                            </button>
                          </div>
                        )}

                        {conflict.status === "investigating" && (
                          <div className="d-flex gap-2 mt-2">
                            <button className="btn-action btn-action-success" style={{ fontSize: 12 }}
                              onClick={() => handleAction(conflict.id, 'resolve', 'Masalah terselesaikan melalui mediasi')}>
                              <FaCheck size={11} /> Selesai
                            </button>
                            <button className="btn-action btn-action-danger" style={{ fontSize: 12 }}
                              onClick={() => { setSelectedConflict(conflict); setRefundModal(true); }}>
                              <FaUndo size={11} /> Refund
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Refund Confirmation Modal */}
        {refundModal && selectedConflict && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: 16 }}>
                <div className="modal-header" style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", color: "white", borderRadius: "16px 16px 0 0" }}>
                  <h5 className="modal-title fw-bold">💸 Konfirmasi Refund 100%</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setRefundModal(false)} />
                </div>
                <div className="modal-body p-4">
                  <div className="alert alert-warning mb-3">
                    <strong>⚠️ Peringatan:</strong> Refund 100% akan mengembalikan seluruh dana ke customer.
                  </div>

                  <div className="p-3 rounded-3 mb-3" style={{ background: "#f8f9fa" }}>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: 13 }}>
                      <span className="text-muted">Pesanan</span>
                      <span className="fw-bold">{selectedConflict.nomor_pesanan}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1" style={{ fontSize: 13 }}>
                      <span className="text-muted">Customer</span>
                      <span className="fw-semibold">{selectedConflict.customer_name}</span>
                    </div>
                    <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                      <span className="text-muted">Jumlah Refund</span>
                      <span className="fw-bold text-danger" style={{ fontSize: 18 }}>{formatRupiah(selectedConflict.total_bayar)}</span>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    <button className="btn-action btn-action-danger w-100 justify-content-center py-3"
                      onClick={() => handleAction(selectedConflict.id, 'refund')}>
                      <FaMoneyBillWave /> Proses Refund 100%
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => setRefundModal(false)}>
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
