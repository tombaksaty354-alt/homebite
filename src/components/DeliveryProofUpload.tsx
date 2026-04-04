"use client";

import { useState, useRef } from "react";
import { useAuth, supabase } from "@/context/AuthContext";
import { FaUpload, FaImage, FaTimes, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

interface DeliveryProofUploadProps {
  orderId: string;
  onUploadComplete: (photoUrl: string) => void;
  currentPhotoUrl?: string;
  userId: string;
}

export default function DeliveryProofUpload({
  orderId,
  onUploadComplete,
  currentPhotoUrl,
  userId
}: DeliveryProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file || isUploading) return;

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
      if (!supabase) {
        throw new Error("Supabase client tidak tersedia");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('delivery-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-proofs')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error("Gagal mendapatkan URL file");
      }

      // Notify parent
      onUploadComplete(urlData.publicUrl);
      
    } catch (error: any) {
      console.error("Error uploading delivery proof:", error);
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
    <div className="delivery-proof-upload">
      {/* Current Photo Display */}
      {previewUrl ? (
        <div className="position-relative">
          <div className="card border-success">
            <div className="card-header bg-success text-white py-1">
              <FaCheckCircle className="me-1" /> Bukti Pengiriman Terupload
            </div>
            <div className="card-body p-2 text-center">
              <img
                src={previewUrl}
                alt="Bukti Pengiriman"
                className="img-fluid rounded"
                style={{ maxHeight: '300px', cursor: 'pointer' }}
                onClick={() => window.open(previewUrl, '_blank')}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={handleRemove}
            title="Hapus foto"
          >
            <FaTimes />
          </button>
        </div>
      ) : (
        /* Upload Area */
        <div
          className={`upload-area border-2 border-dashed rounded p-4 text-center ${
            dragActive ? 'border-primary bg-light' : 'border-secondary'
          }`}
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
            disabled={isUploading}
            id="delivery-proof-file"
          />
          
          {isUploading ? (
            <div>
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Uploading...</span>
              </div>
              <p className="text-muted mb-0">⏳ Mengupload bukti pengiriman...</p>
            </div>
          ) : (
            <div>
              <FaImage size={48} className="text-secondary mb-2" />
              <h6 className="fw-bold mb-2">
                📸 Upload Foto Pengiriman
              </h6>
              <p className="small text-muted mb-3">
                Drag & drop foto di sini atau{' '}
                <label htmlFor="delivery-proof-file" className="text-primary fw-bold" style={{ cursor: 'pointer' }}>
                  pilih file
                </label>
              </p>
              <p className="small text-muted mb-0">
                Format: JPG, PNG, WebP • Maksimal 5MB
              </p>
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

      {/* Success Message */}
      {previewUrl && (
        <div className="form-text mt-2">
          <FaCheckCircle className="text-success me-1" />
          ✅ Bukti pengiriman berhasil diupload. Customer akan melihat foto ini.
        </div>
      )}
    </div>
  );
}
