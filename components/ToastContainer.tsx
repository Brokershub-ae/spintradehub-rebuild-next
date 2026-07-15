'use client';

import { useToast } from '@/lib/toast-context';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const typeStyles = {
    success: {
      bg: '#10B981',
      icon: '✅',
    },
    error: {
      bg: '#EF4444',
      icon: '❌',
    },
    info: {
      bg: '#0056D2',
      icon: 'ℹ️',
    },
    warning: {
      bg: '#FF8C00',
      icon: '⚠️',
    },
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: typeStyles[toast.type].bg,
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            animation: 'slideInUp 300ms ease-out',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <span style={{ fontSize: '18px', minWidth: '24px', marginTop: '2px' }}>
            {typeStyles[toast.type].icon}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '14px' }}>
              {toast.title}
            </p>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.95 }}>
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              padding: 0,
              marginTop: '2px',
            }}
          >
            ✕
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
