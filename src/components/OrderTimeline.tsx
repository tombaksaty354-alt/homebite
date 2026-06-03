"use client";

import { FaClipboardList, FaClock, FaCreditCard, FaCheckCircle, FaBox, FaTruck, FaMotorcycle, FaHome, FaCheck } from "react-icons/fa";

interface OrderTimelineProps {
  status: string;
  timestamps?: {
    created_at?: string;
    paid_at?: string;
    ready_at?: string;
    picked_at?: string;
    shipped_at?: string;
    completed_at?: string;
  };
  compact?: boolean;
}

const STEPS = [
  { key: "menunggu_ongkir", label: "Menunggu Ongkir", icon: FaClipboardList },
  { key: "menunggu_pembayaran", label: "Menunggu Bayar", icon: FaCreditCard },
  { key: "lunas", label: "Lunas", icon: FaCheckCircle },
  { key: "dikirim", label: "Dikirim", icon: FaTruck },
  { key: "selesai", label: "Selesai", icon: FaHome },
];

function getStepIndex(status: string): number {
  const statusMap: Record<string, number> = {
    menunggu_ongkir: 0,
    menunggu_pembayaran: 1,
    lunas: 2,
    siap_dikirim: 2,
    dijemput: 2,
    dikirim: 3,
    selesai: 4,
    dibatalkan: -1,
  };
  return statusMap[status] ?? 0;
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function OrderTimeline({ status, timestamps, compact }: OrderTimelineProps) {
  const currentIndex = getStepIndex(status);

  if (status === "dibatalkan") {
    return (
      <div className="d-flex align-items-center gap-2 p-3 rounded-3" style={{ background: "#fce4ec" }}>
        <div className="rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, background: "#e74c3c", color: "white" }}>
          ✕
        </div>
        <div>
          <div className="fw-bold" style={{ color: "#c62828", fontSize: 14 }}>Pesanan Dibatalkan</div>
          <small style={{ color: "#e57373" }}>Pesanan ini telah dibatalkan</small>
        </div>
      </div>
    );
  }

  const progressPercent = currentIndex >= 0 ? (currentIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="order-timeline" style={compact ? { margin: "12px 0" } : {}}>
      <div
        className="timeline-progress"
        style={{ width: `calc(${progressPercent}% - 48px)` }}
      />
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        let stepClass = "";
        if (i < currentIndex) stepClass = "completed";
        else if (i === currentIndex) stepClass = "active";

        return (
          <div key={step.key} className={`timeline-step ${stepClass}`}>
            <div className="timeline-dot">
              {i < currentIndex ? (
                <FaCheck size={compact ? 10 : 12} />
              ) : (
                <Icon size={compact ? 10 : 14} />
              )}
            </div>
            {!compact && (
              <span className="timeline-label">{step.label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
