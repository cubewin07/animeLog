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
        { opacity: 0, x: 50, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.35, ease: EASING.spring }
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
      x: 40,
      scale: 0.95,
      duration: 0.2,
      ease: EASING.smooth,
      onComplete: () => onDismiss(toast.id),
    });
  };

  return (
    <div
      ref={itemRef}
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        minWidth: '280px',
        maxWidth: '420px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        borderLeft: `4px solid ${
          toast.type === 'success'
            ? '#10b981'
            : toast.type === 'error'
            ? '#f43f5e'
            : '#6366f1'
        }`,
      }}
    >
      {toast.type === 'success' && <CheckCircle2 size={18} color="#34d399" />}
      {toast.type === 'error' && <AlertCircle size={18} color="#fb7185" />}
      {toast.type === 'info' && <Info size={18} color="#818cf8" />}

      <span style={{ fontSize: '13px', flex: 1, color: '#d4e4fa' }}>
        {toast.text}
      </span>

      <button
        onClick={handleClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          padding: '2px',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
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
