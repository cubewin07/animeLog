import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const EXIT_DURATION_MS = 160;

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    if (exiting) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onDismiss(toast.id);
      return;
    }

    setExiting(true);
    timerRef.current = window.setTimeout(() => {
      onDismiss(toast.id);
    }, EXIT_DURATION_MS);
  };

  return (
    <div
      role="status"
      className={`kf-toast is-${toast.type}${exiting ? ' is-exiting' : ''}`}
    >
      <span className="kf-toast-icon" aria-hidden="true">
        {toast.type === 'success' && <CheckCircle2 size={18} />}
        {toast.type === 'error' && <AlertCircle size={18} />}
        {toast.type === 'info' && <Info size={18} />}
      </span>

      <span className="kf-toast-text">{toast.text}</span>

      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss notification"
        className="kf-toast-close"
      >
        <X size={15} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="kf-toast-stack"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
