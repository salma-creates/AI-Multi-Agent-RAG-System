import React from 'react';
import { Home, Bot, FolderKanban, BarChart3, Settings } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'knowledge', label: 'Knowledge Base', icon: FolderKanban },
    { id: 'analytics', label: 'Analytics & Gaps', icon: BarChart3 },
    { id: 'settings', label: 'RAG Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#0F172A',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 700, paddingLeft: '0.75rem', marginBottom: '0.5rem' }}>
        Navigation
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#FFFFFF' : '#94A3B8',
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon style={{ width: '18px', height: '18px', color: isActive ? '#818CF8' : '#64748B' }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
