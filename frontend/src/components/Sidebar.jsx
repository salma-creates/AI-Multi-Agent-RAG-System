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
      backgroundColor: '#FEFCE8',
      borderRight: '1px solid #FEF08A',
      padding: '1.25rem 0.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      minHeight: 'calc(100vh - 60px)'
    }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#A16207', fontWeight: 800, paddingLeft: '0.75rem', marginBottom: '0.5rem' }}>
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
              fontWeight: isActive ? 700 : 600,
              color: isActive ? '#451A03' : '#854D0E',
              backgroundColor: isActive ? '#FEF08A' : 'transparent',
              borderLeft: isActive ? '4px solid #D97706' : '4px solid transparent',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(254, 240, 138, 0.5)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon style={{ width: '18px', height: '18px', color: isActive ? '#B45309' : '#A16207' }} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
