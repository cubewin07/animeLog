import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

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
        <div
          key={toast.id}
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
            onClick={() => onDismiss(toast.id)}
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
      ))}
    </div>
  );
};
