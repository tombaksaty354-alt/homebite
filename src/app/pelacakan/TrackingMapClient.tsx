"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface TrackingMapClientProps {
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
}

export default function TrackingMapClient({ pickupLat, pickupLng, deliveryLat, deliveryLng }: TrackingMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const [driverPos, setDriverPos] = useState({
    lat: pickupLat + (deliveryLat - pickupLat) * 0.4,
    lng: pickupLng + (deliveryLng - pickupLng) * 0.4,
  });

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map
    const map = L.map(mapRef.current, {
      center: [driverPos.lat, driverPos.lng],
      zoom: 14,
      zoomControl: true,
      attributionControl: true,
    });

    // Use OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom icon factory
    const createIcon = (color: string, emoji: string) => {
      return L.divIcon({
        html: `<div style="
          width: 36px; height: 36px; border-radius: 50%;
          background: ${color}; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          border: 3px solid white;
        ">${emoji}</div>`,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
    };

    // Add markers
    L.marker([pickupLat, pickupLng], { icon: createIcon("#27ae60", "🏪") })
      .addTo(map)
      .bindPopup("<b>Lokasi Mitra</b><br/>Penjemputan paket");

    L.marker([deliveryLat, deliveryLng], { icon: createIcon("#e74c3c", "🏠") })
      .addTo(map)
      .bindPopup("<b>Lokasi Tujuan</b><br/>Alamat konsumen");

    // Driver marker (animated)
    const driverMarker = L.marker([driverPos.lat, driverPos.lng], {
      icon: createIcon("#e67e22", "🏍️"),
      zIndexOffset: 1000,
    }).addTo(map).bindPopup("<b>Driver</b><br/>Sedang mengantar pesanan Anda");

    driverMarkerRef.current = driverMarker;

    // Draw route line
    const routeLine = L.polyline(
      [
        [pickupLat, pickupLng],
        [driverPos.lat, driverPos.lng],
        [deliveryLat, deliveryLng],
      ],
      {
        color: "#e67e22",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 8",
      }
    ).addTo(map);

    // Fit bounds
    const bounds = L.latLngBounds([
      [pickupLat, pickupLng],
      [deliveryLat, deliveryLng],
    ]);
    map.fitBounds(bounds.pad(0.3));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Simulate driver movement
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverPos((prev) => {
        const newLat = prev.lat + (deliveryLat - prev.lat) * 0.05;
        const newLng = prev.lng + (deliveryLng - prev.lng) * 0.05;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([newLat, newLng]);
        }

        return { lat: newLat, lng: newLng };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [deliveryLat, deliveryLng]);

  return (
    <div ref={mapRef} className="tracking-map" style={{ width: "100%", height: 400 }} />
  );
}
