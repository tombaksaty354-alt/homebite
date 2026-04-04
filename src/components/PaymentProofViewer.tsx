"use client";

import { useState } from "react";
import { FaTimes, FaDownload, FaSearchPlus, FaSearchMinus, FaExpand, FaCheck, FaTimesCircle } from "react-icons/fa";

interface PaymentProofViewerProps {
  isOpen: boolean;
  onClose: () => void;
  proofUrl: string;
  orderId?: string;
  orderInfo?: {
    customerName?: string;
    mitraName?: string;
    total?: number;
    status?: string;
  };
  canVerify?: boolean;
  onVerify?: (approved: boolean) => void;
}

export default function PaymentProofViewer({
  isOpen,
  onClose,
  proofUrl,
  orderId,
  orderInfo,
  canVerify = false,
  onVerify
}: PaymentProofViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen || !proofUrl) return null;

  function handleZoomIn() {
    setZoom(prev => Math.min(prev + 0.25, 3));
  }

  function handleZoomOut() {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  }

  function handleReset() {
    setZoom(1);
  }

  async function handleVerify(approved: boolean) {
    if (!onVerify || isVerifying) return;
    
    setIsVerifying(true);
    try {
      await onVerify(approved);
    } catch (error) {
      console.error("Error verifying payment:", error);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow-lg"
        style={{ maxWidth: '90vw', maxHeight: '90vh', width: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">
              <FaSearchPlus className="me-2" />
              Bukti Pembayaran
            </h5>
            {orderInfo && (
              <small className="text-muted">
                {orderInfo.customerName && `Customer: ${orderInfo.customerName}`}
                {orderInfo.mitraName && ` • Mitra: ${orderInfo.mitraName}`}
                {orderInfo.total && ` • Total: Rp${orderInfo.total.toLocaleString('id-ID')}`}
              </small>
            )}
          </div>
          <button className="btn btn-sm btn-link" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* Image with Zoom */}
        <div className="card-body p-0 position-relative overflow-auto" style={{ maxHeight: '60vh' }}>
          <div className="text-center p-3">
            <img
              src={proofUrl}
              alt="Bukti Pembayaran"
              className="img-fluid rounded shadow-sm"
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease',
                maxWidth: '100%',
                cursor: 'zoom-in'
              }}
              onClick={() => zoom === 1 ? handleZoomIn() : handleReset()}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="card-footer bg-light">
          <div className="d-flex justify-content-between align-items-center">
            {/* Zoom Controls */}
            <div className="btn-group">
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                title="Zoom out"
              >
                <FaSearchMinus />
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                title="Zoom in"
              >
                <FaSearchPlus />
              </button>
              <button 
                className="btn btn-sm btn-outline-secondary"
                onClick={handleReset}
                title="Reset zoom"
              >
                <FaExpand /> 1x
              </button>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
              <a
                href={proofUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-outline-primary"
              >
                <FaDownload className="me-1" /> Download
              </a>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => window.open(proofUrl, '_blank')}
              >
                <FaExpand className="me-1" /> Fullscreen
              </button>
            </div>
          </div>

          {/* Verification Buttons (for admin/mitra) */}
          {canVerify && onVerify && (
            <div className="mt-3 pt-3 border-top">
              <p className="small text-muted mb-2">
                Verifikasi bukti pembayaran ini:
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success flex-grow-1"
                  onClick={() => handleVerify(true)}
                  disabled={isVerifying}
                >
                  <FaCheck className="me-1" />
                  {isVerifying ? 'Memproses...' : 'Setujui Pembayaran'}
                </button>
                <button
                  className="btn btn-danger flex-grow-1"
                  onClick={() => handleVerify(false)}
                  disabled={isVerifying}
                >
                  <FaTimesCircle className="me-1" />
                  {isVerifying ? 'Memproses...' : 'Tolak Pembayaran'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
