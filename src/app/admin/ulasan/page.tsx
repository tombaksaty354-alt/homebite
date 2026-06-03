"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaStar, FaCheck, FaTimes, FaEye,
  FaFilter, FaSearch, FaUser, FaCalendarAlt, FaSync
} from "react-icons/fa";

export default function AdminUlasan() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, avgRating: "0" });

  const fetchReviews = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/reviews", {
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const result = await res.json();
      if (result.success) {
        setReviews(result.data || []);
        setStats(result.stats || { total: 0, pending: 0, approved: 0, rejected: 0, avgRating: "0" });
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user?.role === "admin") {
      fetchReviews();
    }
  }, [user, loading, router, fetchReviews]);

  async function handleModerate(id: string, action: "approve" | "reject") {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reviewId: id, action }),
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: result.data.status } : r));
        // Update stats
        setStats(prev => {
          const newStats = { ...prev };
          newStats.pending = Math.max(0, newStats.pending - 1);
          if (action === "approve") newStats.approved++;
          else newStats.rejected++;
          return newStats;
        });
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  // Client-side filtering
  const filtered = reviews.filter((r: any) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterRating !== "all" && r.rating !== parseInt(filterRating)) return false;
    if (searchQuery && !(r.komentar || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(r.produk_name || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading || isLoading) return <div className="container py-5 text-center"><div className="searching-spinner mx-auto mb-3" /><p className="text-muted">Memuat ulasan...</p></div>;
  if (!user || user.role !== "admin") return null;

  return (
    <section className="py-4" style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <Link href="/admin" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
            <FaArrowLeft size={12} /> Kembali ke Dashboard
          </Link>
          <h2 className="fw-bold">⭐ Kurasi Ulasan Pelanggan</h2>
          <p className="text-muted">Moderasi ulasan sebelum ditampilkan di halaman produk</p>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Ulasan", value: stats.total, bg: "linear-gradient(135deg, #2c3e50, #34495e)" },
            { label: "Menunggu", value: stats.pending, bg: "linear-gradient(135deg, #f39c12, #e67e22)" },
            { label: "Disetujui", value: stats.approved, bg: "linear-gradient(135deg, #27ae60, #2ecc71)" },
            { label: "Ditolak", value: stats.rejected, bg: "linear-gradient(135deg, #e74c3c, #c0392b)" },
          ].map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="stat-card" style={{ background: s.bg }}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card-glass p-3 mb-4">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white"><FaSearch className="text-muted" /></span>
                <input
                  type="text" className="form-control" placeholder="Cari ulasan..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="pending">🕐 Menunggu</option>
                <option value="approved">✅ Disetujui</option>
                <option value="rejected">❌ Ditolak</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                <option value="all">Semua Rating</option>
                <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                <option value="4">⭐⭐⭐⭐ (4)</option>
                <option value="3">⭐⭐⭐ (3)</option>
                <option value="2">⭐⭐ (2)</option>
                <option value="1">⭐ (1)</option>
              </select>
            </div>
            <div className="col-md-2 text-end">
              <span className="text-muted small">{filtered.length} ulasan</span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="d-flex flex-column gap-3">
          {filtered.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaStar size={48} className="mb-3" style={{ opacity: 0.3 }} />
              <h5>Tidak ada ulasan ditemukan</h5>
            </div>
          ) : (
            filtered.map((review) => (
              <div key={review.id} className="card-glass p-4 animate-fade-in">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36, background: "rgba(230, 126, 34, 0.1)" }}>
                        <FaUser size={14} style={{ color: "#e67e22" }} />
                      </div>
                      <div>
                        <span className="fw-bold" style={{ fontSize: 14 }}>{review.customer_name}</span>
                        <span className="text-muted mx-2">•</span>
                        <span className="text-muted" style={{ fontSize: 13 }}>{review.produk_name}</span>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          size={16}
                          style={{ color: star <= review.rating ? "#f39c12" : "#e0e0e0", marginRight: 2 }}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="mb-2" style={{ fontSize: 14, color: "#2c3e50", lineHeight: 1.6 }}>
                      &ldquo;{review.komentar}&rdquo;
                    </p>

                    <small className="text-muted d-flex align-items-center gap-1">
                      <FaCalendarAlt size={10} />
                      {new Date(review.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </small>
                  </div>

                  <div className="col-md-4 text-end">
                    {/* Status Badge */}
                    <div className="mb-3">
                      <span className={`status-pill ${
                        review.status === "pending" ? "status-pill-pending" :
                        review.status === "approved" ? "status-pill-done" :
                        "status-pill-cancel"
                      }`}>
                        {review.status === "pending" ? "🕐 Menunggu" :
                         review.status === "approved" ? "✅ Disetujui" : "❌ Ditolak"}
                      </span>
                    </div>

                    {/* Actions */}
                    {review.status === "pending" && (
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn-action btn-action-success"
                          onClick={() => handleModerate(review.id, 'approve')}
                        >
                          <FaCheck size={12} /> Setujui
                        </button>
                        <button
                          className="btn-action btn-action-danger"
                          onClick={() => handleModerate(review.id, 'reject')}
                        >
                          <FaTimes size={12} /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
