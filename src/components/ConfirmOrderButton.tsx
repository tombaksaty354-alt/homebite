"use client";

import { useState } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { FaCheckCircle, FaCamera, FaTimes } from "react-icons/fa";

interface ConfirmOrderProps {
  orderId: string;
  orderNumber: string;
  onConfirm: () => void;
  disabled?: boolean;
}

export default function ConfirmOrderButton({
  orderId,
  orderNumber,
  onConfirm,
  disabled = false
}: ConfirmOrderProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [uploadPhoto, setUploadPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleConfirm() {
    if (!user) return;

    setIsConfirming(true);

    try {
      const { data: { session } } = await supabase!.auth.getSession();

      // Call secure server-side API for escrow safety
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          orderId,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal mengonfirmasi pesanan');
      }

      setShowModal(false);
      onConfirm();
      alert('✅ ' + result.message);

    } catch (error: any) {
      console.error('Error confirming order:', error);
      alert('❌ ' + error.message);
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <>
      <button
        className="btn btn-success btn-lg w-100"
        onClick={() => setShowModal(true)}
        disabled={disabled}
      >
        <FaCheckCircle className="me-2" />
        Pesanan Sudah Diterima
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
          style={{ zIndex: 9999 }}
          onClick={() => !isConfirming && setShowModal(false)}
        >
          <div
            className="bg-white rounded shadow-lg w-100 p-4"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Konfirmasi Penerimaan</h5>
              {!isConfirming && (
                <button className="btn btn-sm btn-link" onClick={() => setShowModal(false)}>
                  <FaTimes />
                </button>
              )}
            </div>

            <div className="alert alert-info small mb-3">
              <strong>Pesanan:</strong> {orderNumber}<br />
              <small>Dengan mengkonfirmasi, Anda menyatakan bahwa pesanan telah diterima dengan baik.</small>
            </div>

            {/* Optional Photo Upload */}
            <div className="mb-3">
              <label className="form-label fw-bold small">
                📸 Upload Foto Barang Diterima (Opsional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="form-control form-control-sm"
                disabled={isConfirming}
              />
              <small className="text-muted">Bantuan jika ada masalah dengan pesanan</small>
              
              {photoPreview && (
                <div className="mt-2">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="img-fluid rounded"
                    style={{ maxHeight: '150px' }}
                  />
                </div>
              )}
            </div>

            {/* Optional Notes */}
            <div className="mb-3">
              <label className="form-label fw-bold small">
                📝 Catatan (Opsional)
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                placeholder="Bagaimana kondisi barang? Ada masalah?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isConfirming}
              />
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <button
                className="btn btn-success"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="me-2" />
                    Ya, Sudah Diterima
                  </>
                )}
              </button>
              {!isConfirming && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>
              )}
            </div>

            <div className="alert alert-warning small mt-3 mb-0">
              <strong>Perhatian:</strong> Setelah dikonfirmasi, dana akan masuk ke saldo mitra.
              Jika ada masalah, segera hubungi mitra via chat.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
