"use client";

import { useState, useRef } from "react";
import { FaUpload, FaImage, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface PaymentProofUploadProps {
  onUploadComplete: (imageUrl: string) => void;
  currentProofUrl?: string;
  isRequired?: boolean;
  disabled?: boolean;
  userId: string;
}

export default function PaymentProofUpload({
  onUploadComplete,
  currentProofUrl,
  isRequired = true,
  disabled = false,
  userId
}: PaymentProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentProofUrl || null);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file || disabled || isUploading) return;

    setError("");

    // Validate file type - MUST be image
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("❌ File harus berupa gambar (JPG, PNG, atau WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("❌ Ukuran file maksimal 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const { supabase } = await import("@/context/AuthContext");
      
      if (!supabase) {
        throw new Error("Supabase client tidak tersedia");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error("Gagal mendapatkan URL file");
      }

      // Notify parent
      onUploadComplete(urlData.publicUrl);
      
    } catch (error: any) {
      console.error("Error uploading payment proof:", error);
      setError(`❌ Gagal upload: ${error.message || 'Terjadi kesalahan'}`);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleRemove() {
    setPreviewUrl(null);
    setError("");
    onUploadComplete("");
  }

  return (
    <div className="payment-proof-upload">
      {/* Current Proof Display */}
      {previewUrl ? (
        <div className="position-relative">
          <div className="card border-success">
            <div className="card-header bg-success text-white py-1">
              <FaCheckCircle className="me-1" /> Bukti Pembayaran Terupload
            </div>
            <div className="card-body p-2 text-center">
              <img
                src={previewUrl}
                alt="Bukti Pembayaran"
                className="img-fluid rounded"
                style={{ maxHeight: '300px', cursor: 'pointer' }}
                onClick={() => window.open(previewUrl, '_blank')}
              />
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
              onClick={handleRemove}
              title="Hapus bukti"
            >
              <FaTimes />
            </button>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          className={`upload-area border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'border-primary bg-light' : 'border-secondary'
          } ${disabled ? 'opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="d-none"
            disabled={disabled || isUploading}
            id="payment-proof-file"
          />
          
          {isUploading ? (
            <div>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <p className="text-muted mb-0">⏳ Mengupload bukti pembayaran...</p>
            </div>
          ) : (
            <div>
              <FaImage size={48} className="text-secondary mb-2" />
              <h6 className="fw-bold mb-2">
                {isRequired ? '📸 Upload Bukti Transfer (Wajib)' : '📸 Upload Bukti Transfer (Opsional)'}
              </h6>
              <p className="small text-muted mb-3">
                Drag & drop gambar di sini atau{' '}
                <label htmlFor="payment-proof-file" className="text-primary fw-bold" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
                  pilih file
                </label>
              </p>
              <p className="small text-muted mb-2">
                Format: JPG, PNG, WebP • Maksimal 5MB
              </p>
              {isRequired && (
                <p className="small text-danger mb-0">
                  <FaExclamationCircle className="me-1" />
                  ⚠️ Bukti transfer WAJIB diupload untuk memproses transaksi
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger alert-sm mt-2 py-2 small">
          <FaExclamationCircle className="me-1" /> {error}
        </div>
      )}

      {/* Success Preview without card (for inline display) */}
      {previewUrl && (
        <div className="form-text mt-2">
          <FaCheckCircle className="text-success me-1" />
          ✅ Bukti pembayaran berhasil diupload. Klik gambar untuk memperbesar.
        </div>
      )}
    </div>
  );
}
