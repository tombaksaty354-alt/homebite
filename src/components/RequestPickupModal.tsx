"use client";

import { useState, useEffect } from "react";
import { FaMotorcycle, FaMapMarkerAlt, FaCheckCircle, FaTimes, FaPhone } from "react-icons/fa";
import { supabase } from "@/context/AuthContext";

interface RequestPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (driverInfo: DriverInfo) => void;
  orderId: string;
  orderNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  plateNumber: string;
  eta: number;
}

type ModalState = "confirm" | "searching" | "found" | "error";

export default function RequestPickupModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  orderNumber,
  pickupAddress,
  deliveryAddress,
  customerName,
}: RequestPickupModalProps) {
  const [state, setState] = useState<ModalState>("confirm");
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setState("confirm");
      setDriver(null);
    }
  }, [isOpen]);

  async function handleRequestPickup() {
    setState("searching");
    setErrorMsg("");

    try {
      // Get auth token
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sesi login tidak ditemukan");
      }

      const res = await fetch("/api/orders/logistics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Gagal mengalokasikan driver");
      }

      const driverData: DriverInfo = result.data.driver;
      setDriver(driverData);
      setState("found");

      // Play notification sound
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        }, 180);
      } catch (e) { /* Audio not available */ }
    } catch (error: any) {
      console.error("Driver allocation error:", error);
      setErrorMsg(error.message || "Gagal mencari driver");
      setState("error");
    }
  }

  function handleConfirmDriver() {
    if (driver) {
      onConfirm(driver);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16, border: "none", overflow: "hidden" }}>
          {/* Header */}
          <div className="modal-header border-0 pb-0" style={{ background: "linear-gradient(135deg, #e67e22, #f39c12)", color: "white", padding: "24px 24px 20px" }}>
            <div>
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                <FaMotorcycle size={20} />
                {state === "confirm" ? "Request Pick-up" : state === "searching" ? "Mencari Driver..." : "Driver Ditemukan!"}
              </h5>
              <small style={{ opacity: 0.9 }}>Pesanan {orderNumber}</small>
            </div>
            {state === "confirm" && (
              <button type="button" className="btn-close btn-close-white" onClick={onClose} />
            )}
          </div>

          <div className="modal-body p-4">
            {/* Step 1: Confirm */}
            {state === "confirm" && (
              <div className="animate-fade-in">
                <div className="mb-3">
                  <div className="d-flex align-items-start gap-3 mb-3 p-3 rounded-3" style={{ background: "#f8f9fa" }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 36, height: 36, background: "#e8f5e9" }}>
                      <FaMapMarkerAlt style={{ color: "#27ae60" }} />
                    </div>
                    <div>
                      <small className="text-muted fw-semibold">Alamat Penjemputan (Mitra)</small>
                      <p className="mb-0 fw-medium" style={{ fontSize: 14 }}>{pickupAddress || "Alamat mitra"}</p>
                    </div>
                  </div>

                  <div className="text-center my-2">
                    <div style={{ width: 2, height: 20, background: "#e0e0e0", margin: "0 auto" }} />
                    <FaMotorcycle className="text-muted" size={16} />
                    <div style={{ width: 2, height: 20, background: "#e0e0e0", margin: "0 auto" }} />
                  </div>

                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={{ background: "#f8f9fa" }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 36, height: 36, background: "#fce4ec" }}>
                      <FaMapMarkerAlt style={{ color: "#e74c3c" }} />
                    </div>
                    <div>
                      <small className="text-muted fw-semibold">Alamat Tujuan (Konsumen)</small>
                      <p className="mb-0 fw-medium" style={{ fontSize: 14 }}>{deliveryAddress || "Alamat customer"}</p>
                      <small className="text-muted">{customerName}</small>
                    </div>
                  </div>
                </div>

                <div className="alert border-0 mb-3" style={{ background: "rgba(52, 152, 219, 0.08)", borderRadius: 10 }}>
                  <small style={{ color: "#2c3e50" }}>
                    <strong>ℹ️ Info:</strong> Sistem akan otomatis mencari driver ojol terdekat dari lokasi Anda.
                    Driver akan tiba untuk menjemput paket yang telah Anda siapkan.
                  </small>
                </div>

                <button
                  className="btn-action btn-action-primary w-100 justify-content-center py-3"
                  style={{ fontSize: 15 }}
                  onClick={handleRequestPickup}
                >
                  <FaMotorcycle size={18} /> Panggil Ojol Sekarang
                </button>
              </div>
            )}

            {/* Step 2: Searching */}
            {state === "searching" && (
              <div className="text-center py-4 animate-fade-in">
                <div className="d-flex justify-content-center mb-4">
                  <div className="searching-spinner" />
                </div>
                <h5 className="fw-bold mb-2" style={{ color: "#2c3e50" }}>Mencari Driver Terdekat...</h5>
                <p className="text-muted mb-0">Mohon tunggu, kami sedang mengalokasikan driver ojol untuk pesanan Anda</p>
              </div>
            )}

            {/* Error State */}
            {state === "error" && (
              <div className="text-center py-4 animate-fade-in">
                <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: 56, height: 56, background: "#fce4ec" }}>
                  <FaTimes size={24} style={{ color: "#e74c3c" }} />
                </div>
                <h6 className="fw-bold" style={{ color: "#e74c3c" }}>Gagal Mencari Driver</h6>
                <p className="text-muted small mb-3">{errorMsg}</p>
                <div className="d-flex gap-2 justify-content-center">
                  <button className="btn-action btn-action-primary" onClick={handleRequestPickup}>
                    <FaMotorcycle size={14} /> Coba Lagi
                  </button>
                  <button className="btn btn-outline-secondary" onClick={onClose}>Tutup</button>
                </div>
              </div>
            )}

            {/* Step 3: Driver Found */}
            {state === "found" && driver && (
              <div className="driver-found-anim">
                <div className="text-center mb-4">
                  <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                    style={{ width: 56, height: 56, background: "#e8f5e9" }}>
                    <FaCheckCircle size={28} style={{ color: "#27ae60" }} />
                  </div>
                  <h6 className="fw-bold" style={{ color: "#27ae60" }}>Driver Berhasil Dialokasikan!</h6>
                </div>

                <div className="driver-card mb-3">
                  <div className="driver-avatar">
                    <FaMotorcycle />
                  </div>
                  <div className="driver-info flex-grow-1">
                    <h6>{driver.name}</h6>
                    <small>{driver.vehicle} • {driver.plateNumber}</small>
                    <div className="mt-1">
                      <small className="d-flex align-items-center gap-1" style={{ color: "#e67e22" }}>
                        <FaPhone size={10} /> {driver.phone}
                      </small>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center mb-3">
                  <div className="eta-badge">
                    🕐 Estimasi tiba: {driver.eta} menit
                  </div>
                </div>

                <button
                  className="btn-action btn-action-success w-100 justify-content-center py-3"
                  style={{ fontSize: 15 }}
                  onClick={handleConfirmDriver}
                >
                  <FaCheckCircle size={16} /> Konfirmasi & Lanjutkan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
