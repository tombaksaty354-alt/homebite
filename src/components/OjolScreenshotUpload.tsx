"use client";

import { useState } from "react";
import { FaUpload, FaTimes, FaUser, FaPhone, FaMotorcycle, FaIdCard, FaSpinner, FaImage } from "react-icons/fa";
import { supabase } from "@/context/AuthContext";

interface OjolScreenshotUploadProps {
  orderId: string;
  orderNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OjolScreenshotUpload({
  orderId,
  orderNumber,
  onSuccess,
  onCancel
}: OjolScreenshotUploadProps) {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverVehicle, setDriverVehicle] = useState("");
  const [driverPlate, setDriverPlate] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ Ukuran file maksimal 5MB!");
      return;
    }

    setUploadingFile(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "delivery-proofs");

      const { data: { session } } = await supabase!.auth.getSession();

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengunggah file");
      }

      setScreenshotUrl(result.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Gagal mengunggah screenshot.");
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!screenshotUrl) {
      setErrorMsg("Harap unggah screenshot ojol sebagai bukti pengiriman!");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase!.auth.getSession();

      const response = await fetch("/api/orders/logistics/ojol-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orderId,
          driverName,
          driverPhone,
          driverVehicle,
          driverPlate,
          screenshotUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Gagal mengirim data pengiriman");
      }

      onSuccess();
    } catch (err: any) {
      console.error("Submit ojol error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card border-0 shadow-sm bg-white p-3 p-md-4 rounded-4">
      <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
        <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
          🚚 Upload Informasi Pengiriman Ojol
        </h5>
        <button type="button" className="btn-close" onClick={onCancel}></button>
      </div>

      <div className="alert alert-info py-2 px-3 small mb-4">
        Silakan pesan ojek online (Gojek/Grab/Lalamove) terlebih dahulu untuk mengantar pesanan ini. Setelah itu, upload screenshot pesanan Anda dan isi form data driver di bawah untuk pelacakan customer.
      </div>

      {errorMsg && (
        <div className="alert alert-danger py-2 px-3 small mb-3">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Driver Name */}
          <div className="col-md-6">
            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
              <FaUser size={12} /> Nama Driver
            </label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Contoh: Ahmad Ridwan"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
            />
          </div>

          {/* Driver Phone */}
          <div className="col-md-6">
            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
              <FaPhone size={12} /> No. Telepon Driver
            </label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Contoh: 081234567890"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              required
            />
          </div>

          {/* Driver Vehicle */}
          <div className="col-md-6">
            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
              <FaMotorcycle size={12} /> Kendaraan Driver
            </label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Contoh: Honda Vario Hitam"
              value={driverVehicle}
              onChange={(e) => setDriverVehicle(e.target.value)}
              required
            />
          </div>

          {/* Driver Plate */}
          <div className="col-md-6">
            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
              <FaIdCard size={12} /> Nomor Plat Kendaraan
            </label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Contoh: B 1234 XYZ"
              value={driverPlate}
              onChange={(e) => setDriverPlate(e.target.value)}
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div className="col-12 mt-4">
            <label className="form-label text-muted small fw-semibold d-flex align-items-center gap-1">
              <FaImage size={12} /> Screenshot Bukti Order Ojol
            </label>

            {screenshotUrl ? (
              <div className="position-relative border rounded p-2 text-center bg-light">
                <img
                  src={screenshotUrl}
                  alt="Screenshot Ojol"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: "250px", objectFit: "contain" }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute rounded-circle shadow-sm"
                  style={{ top: "15px", right: "15px" }}
                  onClick={() => setScreenshotUrl("")}
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="border border-dashed rounded-4 p-4 text-center bg-light hover-shadow transition cursor-pointer position-relative">
                <input
                  type="file"
                  accept="image/*"
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                />
                {uploadingFile ? (
                  <div className="py-2">
                    <FaSpinner className="animate-spin text-primary mb-2" size={24} />
                    <div className="small text-muted">Sedang mengunggah screenshot...</div>
                  </div>
                ) : (
                  <div className="py-2">
                    <FaUpload className="text-muted mb-2" size={24} />
                    <div className="small text-dark fw-semibold">Pilih atau Seret Foto Screenshot Ojol</div>
                    <div className="xsmall text-muted mt-1">PNG, JPG, JPEG (Max 5MB)</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-4"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
            disabled={isSubmitting || uploadingFile || !screenshotUrl}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin me-1" /> Memproses...
              </>
            ) : (
              "Kirim & Update Status"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
