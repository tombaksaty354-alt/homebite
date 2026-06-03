"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FaArrowLeft, FaMotorcycle, FaMapMarkerAlt, FaPhone,
  FaCheckCircle, FaClock, FaBox, FaTruck, FaHome
} from "react-icons/fa";
import OrderTimeline from "@/components/OrderTimeline";
import { supabase } from "@/context/AuthContext";

// Dynamically import the map component to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import("./TrackingMapClient"), { ssr: false });

// Default fallback for demo
const DEFAULT_ORDER = {
  id: "demo",
  nomor_pesanan: "HB-DEMO",
  status: "dikirim",
  customer_name: "Demo User",
  mitra_name: "Demo Mitra",
  driver: { name: "Demo Driver", phone: "-", vehicle: "-", plateNumber: "-" },
  pickup: { lat: -6.2088, lng: 106.8456 },
  delivery: { lat: -6.2200, lng: 106.8500 },
  eta: 12,
  items: ["Loading..."],
  total: 0,
};

function PelacakanContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") || "demo";
  const [order, setOrder] = useState<any>(DEFAULT_ORDER);
  const [currentEta, setCurrentEta] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!supabase || orderId === "demo") {
        setIsLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id, nomor_pesanan, status, total_bayar, alamat_lengkap,
            driver_name, driver_phone, driver_vehicle, driver_plate, eta_minutes,
            screenshot_ojol, bukti_pengiriman_url,
            customer:customer_id (nama),
            mitra:mitra_id (nama)
          `)
          .eq("id", orderId)
          .single();

        if (!error && data) {
          // Fetch order items
          const { data: items } = await supabase
            .from("order_items")
            .select("jumlah, produk:produk_id (nama)")
            .eq("order_id", orderId);

          const itemNames = (items || []).map((i: any) => `${i.produk?.nama || "?"} x${i.jumlah}`);

            const customerData = Array.isArray(data.customer) ? data.customer[0] : data.customer;
            const mitraData = Array.isArray(data.mitra) ? data.mitra[0] : data.mitra;

          setOrder({
            id: data.id,
            nomor_pesanan: data.nomor_pesanan,
            status: data.status,
            customer_name: customerData?.nama || "Customer",
            mitra_name: mitraData?.nama || "Mitra",
            driver: {
              name: data.driver_name || "Belum dialokasikan",
              phone: data.driver_phone || "-",
              vehicle: data.driver_vehicle || "-",
              plateNumber: data.driver_plate || "-",
            },
            screenshot: data.screenshot_ojol || data.bukti_pengiriman_url || null,
            pickup: { lat: -6.2088, lng: 106.8456 }, // Default Jakarta coords
            delivery: { lat: -6.2200, lng: 106.8500 },
            eta: data.eta_minutes || 10,
            items: itemNames.length > 0 ? itemNames : ["Memuat item..."],
            total: data.total_bayar || 0,
          });
          setCurrentEta(data.eta_minutes || 10);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  // ETA countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentEta((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-4" style={{ backgroundColor: "#f5f6fa", minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <Link href="/pesanan" className="btn btn-outline-secondary btn-sm mb-3 d-inline-flex align-items-center gap-1">
            <FaArrowLeft size={12} /> Kembali ke Pesanan
          </Link>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h2 className="fw-bold mb-1">📍 Lacak Pesanan</h2>
              <p className="text-muted mb-0">Pesanan <strong>{order.nomor_pesanan}</strong></p>
            </div>
            <div className="eta-badge">
              <FaClock size={14} /> Tiba dalam ~{currentEta} menit
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card-glass p-3 mb-4">
          <OrderTimeline status={order.status} />
        </div>

        {/* Map + Driver Info */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="tracking-container">
              <TrackingMap
                pickupLat={order.pickup.lat}
                pickupLng={order.pickup.lng}
                deliveryLat={order.delivery.lat}
                deliveryLng={order.delivery.lng}
              />
            </div>
          </div>

          <div className="col-lg-4">
            {/* Screenshot Bukti Ojol */}
            {order.screenshot && (
              <div className="card-glass p-4 mb-3 border border-success border-opacity-25 shadow-sm">
                <h6 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
                  <FaCheckCircle /> Bukti Pengiriman Ojol
                </h6>
                <div className="text-center bg-light rounded p-2 border">
                  <img
                    src={order.screenshot}
                    alt="Bukti Screenshot Ojol"
                    className="img-fluid rounded"
                    style={{ maxHeight: "200px", objectFit: "contain", cursor: "pointer", width: "100%" }}
                    onClick={() => window.open(order.screenshot, "_blank")}
                  />
                  <div className="xsmall text-muted mt-2" style={{ fontSize: "11px" }}>
                    💡 Klik gambar untuk membuka ukuran penuh di tab baru
                  </div>
                </div>
              </div>
            )}

            {/* Driver Card */}
            <div className="card-glass p-4 mb-3">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaMotorcycle style={{ color: "#e67e22" }} /> Info Driver
              </h6>
              <div className="driver-card">
                <div className="driver-avatar">
                  <FaMotorcycle />
                </div>
                <div className="driver-info">
                  <h6>{order.driver.name}</h6>
                  <small>{order.driver.vehicle}</small>
                  <div className="mt-1">
                    <small className="fw-bold" style={{ color: "#2c3e50" }}>
                      {order.driver.plateNumber}
                    </small>
                  </div>
                </div>
              </div>
              <button className="btn btn-outline-secondary w-100 mt-3 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: 10 }}>
                <FaPhone size={12} /> Hubungi Driver
              </button>
            </div>

            {/* Order Summary */}
            <div className="card-glass p-4 mb-3">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <FaBox style={{ color: "#e67e22" }} /> Detail Pesanan
              </h6>
              <div className="mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="d-flex justify-content-between py-1" style={{ fontSize: 13, borderBottom: "1px solid #f0f0f0" }}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="d-flex justify-content-between fw-bold" style={{ color: "#e67e22" }}>
                <span>Total</span>
                <span>Rp{order.total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Addresses */}
            <div className="card-glass p-4">
              <h6 className="fw-bold mb-3">📍 Rute Pengiriman</h6>
              <div className="d-flex gap-3 mb-3">
                <div className="d-flex flex-column align-items-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 28, height: 28, background: "#e8f5e9" }}>
                    <FaMapMarkerAlt size={12} style={{ color: "#27ae60" }} />
                  </div>
                  <div style={{ width: 2, height: 30, background: "#e0e0e0", margin: "4px 0" }} />
                  <div className="rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 28, height: 28, background: "#fce4ec" }}>
                    <FaMapMarkerAlt size={12} style={{ color: "#e74c3c" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-3">
                    <small className="text-muted fw-semibold">Dari</small>
                    <p className="mb-0 fw-medium" style={{ fontSize: 13 }}>{order.mitra_name}</p>
                  </div>
                  <div>
                    <small className="text-muted fw-semibold">Ke</small>
                    <p className="mb-0 fw-medium" style={{ fontSize: 13 }}>{order.customer_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PelacakanPage() {
  return (
    <Suspense fallback={
      <div className="container py-5 text-center">
        <div className="searching-spinner mx-auto mb-3" />
        <p className="text-muted">Memuat pelacakan...</p>
      </div>
    }>
      <PelacakanContent />
    </Suspense>
  );
}
