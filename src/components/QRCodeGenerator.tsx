"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaPrint, FaQrcode } from "react-icons/fa";

interface QRCodeGeneratorProps {
  orderId: string;
  nomorPesanan: string;
  customerName?: string;
  totalBayar?: number;
  tanggal?: string;
}

export default function QRCodeGenerator({
  orderId,
  nomorPesanan,
  customerName,
  totalBayar,
  tanggal,
}: QRCodeGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const qrValue = JSON.stringify({
    id: orderId,
    nomor: nomorPesanan,
    platform: "HOMEBITE",
  });

  function handlePrint() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Resi - ${nomorPesanan}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', 'Segoe UI', sans-serif; padding: 20px; }
            .qr-receipt { border: 2px dashed #ddd; border-radius: 12px; padding: 24px; max-width: 360px; margin: 0 auto; }
            .qr-header { text-align: center; border-bottom: 1px dashed #ddd; padding-bottom: 16px; margin-bottom: 16px; }
            .qr-header h4 { font-weight: 800; color: #e67e22; margin: 0 0 4px; font-size: 20px; }
            .qr-header small { color: #95a5a6; font-size: 12px; }
            .qr-code-wrapper { display: flex; justify-content: center; padding: 16px 0; }
            .qr-order-id { text-align: center; font-size: 16px; font-weight: 700; color: #2c3e50; margin: 8px 0 16px; letter-spacing: 1px; }
            .qr-details { border-top: 1px dashed #ddd; padding-top: 16px; }
            .detail-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
            .detail-row .label { color: #95a5a6; }
            .detail-row .value { font-weight: 600; color: #2c3e50; }
            .qr-footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ddd; }
            .qr-footer small { color: #bdc3c7; font-size: 10px; }
          </style>
        </head>
        <body>${printContent}</body>
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </html>
    `);
    printWindow.document.close();
  }

  function formatRupiah(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
  }

  return (
    <div>
      {/* Preview & Print Button */}
      <button
        className="btn-action btn-action-primary w-100 justify-content-center"
        onClick={handlePrint}
      >
        <FaPrint /> Cetak Resi & QR Code
      </button>

      {/* Hidden print area */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={printRef}>
          <div className="qr-receipt">
            <div className="qr-header">
              <h4>🍽️ HOMEBITE</h4>
              <small>Marketplace Makanan Rumahan</small>
            </div>

            <div className="qr-code-wrapper">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin
                bgColor="white"
                fgColor="#2c3e50"
              />
            </div>

            <div className="qr-order-id">{nomorPesanan}</div>

            <div className="qr-details">
              {customerName && (
                <div className="detail-row">
                  <span className="label">Pelanggan</span>
                  <span className="value">{customerName}</span>
                </div>
              )}
              {totalBayar !== undefined && (
                <div className="detail-row">
                  <span className="label">Total</span>
                  <span className="value">{formatRupiah(totalBayar)}</span>
                </div>
              )}
              {tanggal && (
                <div className="detail-row">
                  <span className="label">Tanggal</span>
                  <span className="value">{new Date(tanggal).toLocaleDateString("id-ID")}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">ID Pesanan</span>
                <span className="value" style={{ fontSize: 10 }}>{orderId.substring(0, 12)}...</span>
                </div>
            </div>

            <div className="qr-footer">
              <small>Scan QR code ini untuk validasi penyerahan paket</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
