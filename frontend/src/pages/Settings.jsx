import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Sliders, Cpu, Database } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function Settings({ showToast }) {
  const [settings, setSettings] = useState({
    top_k: 3,
    similarity_threshold: 0.60,
    chunk_size: 800,
    chunk_overlap: 150,
    embedding_model: 'gemini-embedding-001',
    llm_model: 'gemini-3.8-flash',
    voice_language: 'en-US'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const res = await getSettings();
        setSettings(res);
      } catch (err) {
        console.error(err);
        showToast('Failed to load runtime settings.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await updateSettings(settings);
      setSettings(res);
      showToast('RAG hyperparameters updated successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>Loading settings...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B' }}>RAG Hyperparameter Settings</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
            Tune vector retrieval parameters, chunking windows, and model configurations in real time.
          </p>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
          <Save style={{ width: '16px', height: '16px' }} />
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>

      {/* RAG Tuning Sliders */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Sliders style={{ width: '20px', height: '20px', color: '#D97706' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>Retrieval & Chunking Tuning</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {/* Top-K Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <label style={{ fontWeight: 600, color: '#1E293B' }}>Top-K Chunks to Retrieve:</label>
              <span style={{ fontWeight: 700, color: '#D97706', fontSize: '1rem' }}>{settings.top_k}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.top_k}
              onChange={(e) => setSettings({ ...settings, top_k: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: '#D97706' }}
            />
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem' }}>
              Number of most semantically relevant chunks passed to the LLM. Standard benchmark is 3 to 5.
            </p>
          </div>

          {/* Similarity Threshold Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <label style={{ fontWeight: 600, color: '#1E293B' }}>Similarity Threshold:</label>
              <span style={{ fontWeight: 700, color: '#059669', fontSize: '1rem' }}>{(settings.similarity_threshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.95"
              step="0.05"
              value={settings.similarity_threshold}
              onChange={(e) => setSettings({ ...settings, similarity_threshold: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: '#059669' }}
            />
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem' }}>
              Minimum cosine similarity score required for a chunk to be considered relevant.
            </p>
          </div>

          {/* Chunk Size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <label style={{ fontWeight: 600, color: '#1E293B' }}>Chunk Size (characters):</label>
              <span style={{ fontWeight: 700, color: '#7C3AED', fontSize: '1rem' }}>{settings.chunk_size}</span>
            </div>
            <input
              type="range"
              min="300"
              max="2000"
              step="50"
              value={settings.chunk_size}
              onChange={(e) => setSettings({ ...settings, chunk_size: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: '#7C3AED' }}
            />
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem' }}>
              Maximum character length per extracted text chunk during document ingestion.
            </p>
          </div>

          {/* Chunk Overlap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <label style={{ fontWeight: 600, color: '#1E293B' }}>Chunk Overlap (characters):</label>
              <span style={{ fontWeight: 700, color: '#EAB308', fontSize: '1rem' }}>{settings.chunk_overlap}</span>
            </div>
            <input
              type="range"
              min="0"
              max="400"
              step="25"
              value={settings.chunk_overlap}
              onChange={(e) => setSettings({ ...settings, chunk_overlap: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: '#EAB308' }}
            />
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem' }}>
              Overlapping boundary characters preserved between adjacent chunks to maintain context.
            </p>
          </div>
        </div>
      </div>

      {/* Model & AI Services Info Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Cpu style={{ width: '20px', height: '20px', color: '#D97706' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1E293B' }}>AI Models & Runtimes</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF9C3', border: '1px solid #FEF08A' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Primary LLM Model</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{settings.llm_model}</div>
            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600, marginTop: '0.25rem' }}>Google Gemini Multimodal Reasoning Engine</div>
          </div>

          <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#FEF9C3', border: '1px solid #FEF08A' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Dense Embedding Model</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', marginTop: '0.25rem' }}>{settings.embedding_model}</div>
            <div style={{ fontSize: '0.78rem', color: '#D97706', fontWeight: 600, marginTop: '0.25rem' }}>3072-Dimensional Vector Embeddings</div>
          </div>
        </div>
      </div>
    </div>
  );
}

