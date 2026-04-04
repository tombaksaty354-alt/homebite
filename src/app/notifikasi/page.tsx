"use client";

import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaBell, FaCheck, FaTrash } from "react-icons/fa";
import { useState } from "react";
import { supabase } from "@/context/AuthContext";

export default function NotifikasiPage() {
  const { user, loading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const router = useRouter();
  const [filter, setFilter] = useState<"semua" | "belum_dibaca">("semua");

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!user) {
    router.push("/login");
    return null;
  }

  const filteredNotifs = filter === "belum_dibaca" 
    ? notifications.filter(n => !n.dibaca)
    : notifications;

  const iconColors: any = {
    info: "bg-primary text-white",
    success: "bg-success text-white",
    warning: "bg-warning text-dark",
    error: "bg-danger text-white",
  };

  async function handleDelete(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      refreshNotifications();
    }
  }

  return (
    <section className="py-5 bg-light">
      <div className="container">
        <div className="mb-4">
          <button className="btn btn-outline-secondary btn-sm mb-2" onClick={() => router.back()}>
            <FaArrowLeft className="me-1" /> Kembali
          </button>
          <h2 className="fw-bold"><FaBell className="me-2" /> Notifikasi</h2>
          {unreadCount > 0 && (
            <p className="text-muted">Anda memiliki <strong>{unreadCount} notifikasi belum dibaca</strong></p>
          )}
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div className="btn-group" role="group">
              <button 
                className={`btn btn-sm ${filter === 'semua' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter("semua")}
              >
                Semua
              </button>
              <button 
                className={`btn btn-sm ${filter === 'belum_dibaca' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter("belum_dibaca")}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-outline-success" onClick={markAllAsRead}>
                <FaCheck className="me-1" /> Tandai Semua Dibaca
              </button>
            )}
          </div>
        </div>

        {filteredNotifs.length === 0 ? (
          <div className="card shadow-sm text-center py-5">
            <FaBell size={48} className="text-muted mb-3" />
            <h5 className="text-muted">Tidak ada notifikasi</h5>
            <p className="text-muted small">Notifikasi akan muncul ketika ada aktivitas penting</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div key={notif.id} className={`card shadow-sm mb-3 border-start ${!notif.dibaca ? 'border-4 border-primary' : ''}`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <span className={`badge rounded-pill me-2 ${iconColors[notif.tipe] || "bg-secondary text-white"}`}>
                        {notif.tipe.toUpperCase()}
                      </span>
                      <h6 className="mb-0 fw-bold">{notif.title}</h6>
                    </div>
                    <p className="mb-2 text-muted">{notif.message}</p>
                    <small className="text-muted">
                      {new Date(notif.created_at).toLocaleString("id-ID", { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </small>
                  </div>
                  <div className="d-flex gap-2">
                    {!notif.dibaca && (
                      <button className="btn btn-sm btn-outline-primary" onClick={() => markAsRead(notif.id)}>
                        <FaCheck />
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(notif.id)}>
                      <FaTrash />
                    </button>
                    {notif.link && (
                      <Link href={notif.link} className="btn btn-sm btn-primary" onClick={() => markAsRead(notif.id)}>
                        Lihat Detail
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
