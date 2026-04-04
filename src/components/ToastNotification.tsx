"use client";

import { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <FaCheckCircle className="text-success me-2" />,
  error: <FaExclamationCircle className="text-danger me-2" />,
  info: <FaInfoCircle className="text-info me-2" />,
  warning: <FaExclamationCircle className="text-warning me-2" />,
};

const toastBgColors: Record<ToastType, string> = {
  success: "bg-success bg-opacity-10",
  error: "bg-danger bg-opacity-10",
  info: "bg-info bg-opacity-10",
  warning: "bg-warning bg-opacity-10",
};

let toastId = 0;

export function showToast(type: ToastType, message: string) {
  toastId++;
  const event = new CustomEvent("toast-add", {
    detail: { id: toastId, type, message } as ToastMessage,
  });
  window.dispatchEvent(event);
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastAdd = (event: Event) => {
      const toast = (event as CustomEvent<ToastMessage>).detail;
      setToasts((prev) => [...prev, toast]);

      // Auto remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4000);
    };

    window.addEventListener("toast-add", handleToastAdd);
    return () => window.removeEventListener("toast-add", handleToastAdd);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast show mb-2 ${toastBgColors[toast.type]}`}
          role="alert"
          style={{ minWidth: "300px" }}
        >
          <div className="toast-body d-flex align-items-center">
            {toastIcons[toast.type]}
            <span className="flex-grow-1">{toast.message}</span>
            <button
              type="button"
              className="btn-close btn-close-sm ms-2"
              onClick={() => removeToast(toast.id)}
            >
              <FaTimes />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
