import React from 'react';
import { Bot, FolderKanban, BarChart3, ShieldCheck, Zap, Mic, ArrowRight } from 'lucide-react';

export default function Home({ setActiveTab }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div className="glass-card" style={{
        padding: '2.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4) 0%, rgba(254, 249, 195, 0.7) 100%)',
        border: '1px solid #FEF08A',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 2 }}>
          <div className="badge badge-yellow" style={{ marginBottom: '1rem' }}>
            Multi-Agent RAG Knowledge Retrieval System
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.15, color: '#1E293B' }}>
            Enterprise Grounded Knowledge & <span className="gradient-text">Multi-Agent Intelligence</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#64748B', marginBottom: '2rem', lineHeight: 1.6 }}>
            Upload knowledge documents (PDF, DOCX, TXT, CSV), ask complex factual or procedural questions, and receive grounded answers with full source transparency and zero hallucinations.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setActiveTab('assistant')}>
              <Bot style={{ width: '18px', height: '18px' }} />
              Launch AI Assistant
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
            <button className="btn-secondary" onClick={() => setActiveTab('knowledge')}>
              <FolderKanban style={{ width: '18px', height: '18px' }} />
              Upload Knowledge Documents
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Zap style={{ width: '22px', height: '22px', color: '#D97706' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            5-Agent Pipeline
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
            Automated intent classification, Top-K vector retrieval, anti-hallucination response generation, clarification detection, and multi-turn memory.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck style={{ width: '22px', height: '22px', color: '#059669' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            Strict Grounding & Citations
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
            Answers are generated strictly using retrieved evidence with explicit source document names, page numbers, relevance scores, and confidence indicators.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Mic style={{ width: '22px', height: '22px', color: '#D97706' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            Two-Way Voice Features
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
            Hands-free Web Speech API integration supporting Speech-to-Text microphone input and Text-to-Speech audio response synthesis.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 style={{ width: '22px', height: '22px', color: '#7C3AED' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1E293B' }}>
            Analytics & Knowledge Gap Detection
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5 }}>
            Tracks query metrics, classification distribution, latency, and automatically identifies unanswered or low-confidence topics as knowledge gaps.
          </p>
        </div>
      </div>
    </div>
  );
}
