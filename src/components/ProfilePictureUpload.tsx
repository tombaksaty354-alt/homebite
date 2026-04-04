"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaCamera, FaTrash, FaUpload, FaCheckCircle } from "react-icons/fa";

interface ProfilePictureUploadProps {
  size?: number;
  showEditControls?: boolean;
  onUploadComplete?: (url: string) => void;
}

export default function ProfilePictureUpload({ 
  size = 120, 
  showEditControls = true,
  onUploadComplete 
}: ProfilePictureUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Hanya file gambar yang didukung' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran file maksimal 2MB' });
      return;
    }

    setIsUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || '');

      const response = await fetch('/api/profile-picture', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onUploadComplete?.(result.url);
        // Optimistic update - no reload needed!
        // AuthContext should handle the update via onUploadComplete callback
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal upload gambar' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus foto profil?")) return;

    setIsUploading(true);
    try {
      const response = await fetch('/api/profile-picture', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal hapus gambar' });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = () => {
    if (!user?.nama) return "?";
    return user.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="text-center">
      {/* Profile Picture Container */}
      <div 
        className="position-relative d-inline-block"
        style={{ width: size, height: size }}
      >
        {/* Profile Picture or Initials */}
        {user?.profile_picture ? (
          <img 
            src={user.profile_picture} 
            alt={user.nama}
            className="rounded-circle object-cover"
            style={{ 
              width: size, 
              height: size, 
              objectFit: 'cover',
              border: '3px solid #e67e22'
            }}
          />
        ) : (
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
            style={{ 
              width: size, 
              height: size, 
              fontSize: size * 0.35,
              border: '3px solid #e67e22'
            }}
          >
            {getInitials()}
          </div>
        )}

        {/* Edit Overlay Button */}
        {showEditControls && !isUploading && (
          <button
            className="position-absolute bottom-0 end-0 btn btn-sm btn-warning rounded-circle p-2 shadow"
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              width: size * 0.3, 
              height: size * 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Ganti foto profil"
          >
            <FaCamera size={size * 0.15} />
          </button>
        )}

        {/* Loading Overlay */}
        {isUploading && (
          <div 
            className="position-absolute top-0 start-0 w-100 h-100 rounded-circle bg-white bg-opacity-75 d-flex align-items-center justify-content-center"
            style={{ zIndex: 10 }}
          >
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="d-none"
      />

      {/* Action Buttons */}
      {showEditControls && !isUploading && (
        <div className="mt-3 d-flex gap-2 justify-content-center">
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload className="me-1" /> Upload Foto
          </button>
          {user?.profile_picture && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleDelete}
            >
              <FaTrash className="me-1" /> Hapus
            </button>
          )}
        </div>
      )}

      {/* Message Alert */}
      {message.text && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} small mt-3 mb-0 py-2`}>
          {message.type === 'success' && <FaCheckCircle className="me-2" />}
          {message.text}
        </div>
      )}

      {/* Help Text */}
      {showEditControls && (
        <small className="text-muted d-block mt-2">
          Format: JPG, PNG, WebP, GIF • Maksimal 2MB
        </small>
      )}
    </div>
  );
}
