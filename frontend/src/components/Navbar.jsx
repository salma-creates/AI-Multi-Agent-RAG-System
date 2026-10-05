import React from 'react';
import { Cpu, ShieldCheck, Database, Settings } from 'lucide-react';

export default function Navbar({ healthData, onOpenSettings }) {
  const isHealthy = healthData?.status === 'healthy';
  const indexedCount = healthData?.indexed_chunks || 0;

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.875rem 1.5rem',
      backgroundColor: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <Cpu style={{ width: '22px', height: '22px', color: '#FFF' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            LUMINA <span className="gradient-text">AI</span>
          </h1>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 500 }}>
            Multi-Agent RAG Knowledge Retrieval System
          </p>
        </div>
      </div>

      {/* Right Stats & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Indexed Chunks pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: '#1F2937',
          border: '1px solid #374151',
          fontSize: '0.78rem',
          color: '#E5E7EB'
        }}>
          <Database style={{ width: '14px', height: '14px', color: '#8B5CF6' }} />
          <span>{indexedCount} Chunks Indexed</span>
        </div>

        {/* Backend Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: isHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.78rem',
          color: isHealthy ? '#34D399' : '#F87171'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isHealthy ? '#10B981' : '#EF4444',
            display: 'inline-block'
          }}></span>
          <span>{isHealthy ? 'FastAPI Online' : 'Connecting...'}</span>
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={onOpenSettings}
          title="RAG Hyperparameter Settings"
          style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '6px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#FFF'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
        >
          <Settings style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </header>
  );
}
