import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.25rem',
      borderRadius: '10px',
      backgroundColor: isSuccess ? '#064E3B' : '#7F1D1D',
      color: '#FFFFFF',
      border: `1px solid ${isSuccess ? '#10B981' : '#EF4444'}`,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {isSuccess ? <CheckCircle style={{ width: '20px', height: '20px', color: '#34D399' }} /> : <AlertCircle style={{ width: '20px', height: '20px', color: '#F87171' }} />}
      <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{toast.message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', padding: '0.2rem', marginLeft: '0.5rem' }}
      >
        <X style={{ width: '16px', height: '16px' }} />
      </button>
    </div>
  );
}
