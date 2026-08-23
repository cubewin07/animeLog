import React, { useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { EASING, prefersReducedMotion } from '../utils/animations';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !itemRef.current) return;
      gsap.fromTo(
        itemRef.current,
        { opacity: 0, x: 30, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 0.3, ease: EASING.smooth }
      );
    },
    { scope: itemRef }
  );

  const handleClose = () => {
    if (prefersReducedMotion() || !itemRef.current) {
      onDismiss(toast.id);
      return;
    }

    gsap.to(itemRef.current, {
      opacity: 0,
      x: 30,
      duration: 0.15,
      ease: EASING.smooth,
      onComplete: () => onDismiss(toast.id),
    });
  };

  const borderColor =
    toast.type === 'success'
      ? 'var(--spine-text)'
      : toast.type === 'error'
      ? 'var(--spine)'
      : 'var(--graphite)';

  return (
    <div
      ref={itemRef}
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '420px',
        backgroundColor: 'var(--desk-raised)',
        border: '1px solid var(--border-desk-medium)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-raised)',
        color: 'var(--text-desk)',
      }}
    >
      {toast.type === 'success' && <CheckCircle2 size={18} color="var(--spine-text)" />}
      {toast.type === 'error' && <AlertCircle size={18} color="var(--danger)" />}
      {toast.type === 'info' && <Info size={18} color="var(--text-desk-muted)" />}

      <span style={{ fontSize: '14px', flex: 1, lineHeight: 1.4 }}>
        {toast.text}
      </span>

      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-desk-muted)',
          padding: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-sm)',
        }}
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
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};
