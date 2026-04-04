"use client";

import { useState, useMemo, useEffect } from "react";
import * as React from "react";
import { useNotifications } from "@/context/NotificationContext";
import { FaBell, FaCheck, FaComments, FaShoppingBag, FaBullhorn } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NotificationTab = "chat" | "pesanan" | "promo";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>("chat");
  const router = useRouter();

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      refreshNotifications();
    }
  }, [showDropdown]);

  async function handleNotificationClick(notif: any) {
    // Delete notification immediately (auto-remove on click)
    await markAsRead(notif.id);
    
    // Redirect to chat page
    if (notif.link) {
      router.push(notif.link);
    }
    
    setShowDropdown(false);
  }

  // Categorize notifications based on title/content
  const categorizedNotifications = useMemo(() => {
    const chat: any[] = [];
    const pesanan: any[] = [];
    const promo: any[] = [];

    console.log('🔔 Categorizing notifications:', notifications.length);

    notifications.forEach(notif => {
      const title = (notif.title || "").toLowerCase();
      const message = (notif.message || "").toLowerCase();
      const tipe = notif.tipe || "";
      const link = notif.link || "";
      
      console.log('🔔 Processing:', { title, message: message.substring(0, 50), tipe, link });
      
      // Categorization logic - lebih luas untuk menangkap semua tipe
      const isChat = 
        title.includes("pesan") || 
        title.includes("chat") || 
        message.includes("pesan") ||
        message.includes("chat") ||
        title.includes("pesan baru") ||
        message.includes(":") || // Chat biasanya format "User: message"
        link.includes("/chat") ||
        tipe === "info"; // Chat biasanya tipe info
      
      const isPesanan = 
        title.includes("pesanan") || 
        title.includes("order") || 
        message.includes("pesanan") || 
        message.includes("order") ||
        title.includes("pembayaran") ||
        message.includes("pembayaran") ||
        title.includes("pengiriman") ||
        message.includes("dikirim") ||
        message.includes("selesai") ||
        link.includes("/pesanan") ||
        link.includes("/order");
      
      const isPromo =
        title.includes("promo") ||
        message.includes("promo") ||
        title.includes("diskon") ||
        message.includes("diskon") ||
        title.includes("penawaran") ||
        message.includes("penawaran") ||
        tipe === "success"; // Promo biasanya tipe success
      
      // Assign to category based on priority
      if (isPesanan) {
        pesanan.push(notif);
        console.log('📦 Assigned to Pesanan:', notif.title);
      } else if (isPromo) {
        promo.push(notif);
        console.log('📢 Assigned to Promo:', notif.title);
      } else if (isChat) {
        chat.push(notif);
        console.log('💬 Assigned to Chat:', notif.title);
      } else {
        // Default: assign berdasarkan link atau tipe
        if (link.includes("/chat")) {
          chat.push(notif);
          console.log('💬 Default to Chat (link):', notif.title);
        } else if (link.includes("/pesanan") || link.includes("/order")) {
          pesanan.push(notif);
          console.log('📦 Default to Pesanan (link):', notif.title);
        } else if (String(tipe) === "success") {
          promo.push(notif);
          console.log('📢 Default to Promo (type):', notif.title);
        } else {
          chat.push(notif); // Default ke chat untuk pesan umum
          console.log('💬 Default to Chat (fallback):', notif.title);
        }
      }
    });

    console.log('🔔 Categorization result:', { 
      chat: chat.length, 
      pesanan: pesanan.length, 
      promo: promo.length 
    });

    return { chat, pesanan, promo };
  }, [notifications]);

  const currentNotifications = categorizedNotifications[activeTab];
  const currentUnreadCount = currentNotifications.filter(n => !n.dibaca).length;

  const tabConfigs: Record<NotificationTab, { label: string; icon: any; count: number }> = {
    chat: { label: "Chat", icon: FaComments, count: categorizedNotifications.chat.filter(n => !n.dibaca).length },
    pesanan: { label: "Pesanan", icon: FaShoppingBag, count: categorizedNotifications.pesanan.filter(n => !n.dibaca).length },
    promo: { label: "Promo", icon: FaBullhorn, count: categorizedNotifications.promo.filter(n => !n.dibaca).length },
  };

  const iconColors: any = {
    info: "text-primary",
    success: "text-success",
    warning: "text-warning",
    error: "text-danger",
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-light position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="dropdown-menu dropdown-menu-end show" style={{ minWidth: "380px", maxWidth: "420px" }}>
          {/* Header */}
          <div className="dropdown-header d-flex justify-content-between align-items-center">
            <strong>Notifikasi</strong>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-outline-primary" onClick={markAllAsRead}>
                <FaCheck className="me-1" /> Tandai Semua
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="d-flex border-bottom">
            {(Object.keys(tabConfigs) as NotificationTab[]).map((tab) => {
              const config = tabConfigs[tab];
              const Icon = config.icon;
              return (
                <button
                  key={tab}
                  className={`flex-grow-1 py-2 px-3 text-center border-0 ${
                    activeTab === tab 
                      ? 'bg-primary text-white fw-bold' 
                      : 'bg-light text-muted'
                  }`}
                  onClick={() => setActiveTab(tab)}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon className="me-1" />
                  {config.label}
                  {config.count > 0 && (
                    <span className={`badge rounded-pill ms-1 ${
                      activeTab === tab ? 'bg-light text-primary' : 'bg-danger'
                    }`}>
                      {config.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {currentNotifications.length === 0 ? (
              <div className="dropdown-item-text text-center text-muted py-4">
                {React.createElement(tabConfigs[activeTab].icon, { size: 32, className: 'mb-2' })}
                <p className="mb-0">Tidak ada notifikasi {tabConfigs[activeTab].label.toLowerCase()}</p>
              </div>
            ) : (
              currentNotifications.slice(0, 10).map((notif) => (
                <button
                  key={notif.id}
                  className={`dropdown-item ${!notif.dibaca ? 'bg-light' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ whiteSpace: "normal", padding: "0.75rem 1rem" }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-1">
                        <FaBell className={`me-2 ${iconColors[notif.tipe] || "text-muted"}`} size={14} />
                        <strong className="small">{notif.title}</strong>
                      </div>
                      <p className="mb-0 small text-muted">{notif.message}</p>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        {new Date(notif.created_at).toLocaleString("id-ID")}
                      </small>
                    </div>
                    {!notif.dibaca && (
                      <span className="badge bg-primary ms-2">Baru</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="dropdown-divider"></div>
          <Link href="/notifikasi" className="dropdown-item text-center" onClick={() => setShowDropdown(false)}>
            Lihat Semua Notifikasi
          </Link>
        </div>
      )}
    </div>
  );
}
