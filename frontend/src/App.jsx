import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Home from './pages/Home';
import Assistant from './pages/Assistant';
import KnowledgeBase from './pages/KnowledgeBase';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

import { getHealth, preloadBenchmark } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [healthData, setHealthData] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);

  const fetchHealth = async () => {
    try {
      const data = await getHealth();
      setHealthData(data);
    } catch (err) {
      console.warn('Backend connection polling:', err.message);
      setHealthData({ status: 'offline', indexed_chunks: 0 });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handlePreloadBenchmark = async () => {
    try {
      setIsPreloading(true);
      const res = await preloadBenchmark();
      showToast(res.message || 'Benchmark test document ingested!', 'success');
      await fetchHealth();
    } catch (err) {
      showToast(err.message || 'Preloading benchmark failed.', 'error');
    } finally {
      setIsPreloading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FAF8ED', color: '#1E293B', overflow: 'hidden' }}>
      {/* Animated Subtle Background Graphics - Soft Pastel Yellow & Cream Orbs */}
      <div className="bg-ambient-wrapper" aria-hidden="true">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
        <div className="ambient-grid-pattern"></div>
      </div>

      {/* Top Header Navbar */}
      <Navbar healthData={healthData} onOpenSettings={() => setActiveTab('settings')} />

      {/* Body Content with Sidebar */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flex: 1 }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{ flex: 1, backgroundColor: 'transparent', overflowY: 'auto' }}>
          {activeTab === 'home' && (
            <Home
              setActiveTab={setActiveTab}
              onPreloadBenchmark={handlePreloadBenchmark}
              isPreloading={isPreloading}
            />
          )}

          {activeTab === 'assistant' && (
            <Assistant showToast={showToast} />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeBase
              showToast={showToast}
              onDocumentUploaded={fetchHealth}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics showToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <Settings showToast={showToast} />
          )}
        </main>
      </div>

      {/* Floating Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

