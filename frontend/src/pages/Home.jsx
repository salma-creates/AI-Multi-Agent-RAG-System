import React from 'react';
import { Bot, FolderKanban, BarChart3, ShieldCheck, Zap, Database, Mic, ArrowRight } from 'lucide-react';

export default function Home({ setActiveTab, onPreloadBenchmark, isPreloading }) {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div className="glass-card" style={{
        padding: '2.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 27, 75, 0.8) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '750px', position: 'relative', zIndex: 2 }}>
          <div className="badge badge-purple" style={{ marginBottom: '1rem' }}>
            Multi-Agent RAG Knowledge Retrieval System
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.15 }}>
            Enterprise Grounded Knowledge & <span className="gradient-text">Multi-Agent Intelligence</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#94A3B8', marginBottom: '2rem', lineHeight: 1.6 }}>
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
            <button className="btn-secondary" onClick={onPreloadBenchmark} disabled={isPreloading}>
              <Database style={{ width: '18px', height: '18px', color: '#818CF8' }} />
              {isPreloading ? 'Indexing Benchmark...' : 'Preload Benchmark Test Document'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Zap style={{ width: '22px', height: '22px', color: '#818CF8' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#F1F5F9' }}>
            5-Agent Pipeline
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Automated intent classification, Top-K vector retrieval, anti-hallucination response generation, clarification detection, and multi-turn memory.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <ShieldCheck style={{ width: '22px', height: '22px', color: '#34D399' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#F1F5F9' }}>
            Strict Grounding & Citations
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Answers are generated strictly using retrieved evidence with explicit source document names, page numbers, relevance scores, and confidence indicators.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Mic style={{ width: '22px', height: '22px', color: '#FBBF24' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#F1F5F9' }}>
            Two-Way Voice Features
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Hands-free Web Speech API integration supporting Speech-to-Text microphone input and Text-to-Speech audio response synthesis.
          </p>
        </div>

        <div className="glass-card glass-card-hover" style={{ padding: '1.5rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(217, 70, 239, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <BarChart3 style={{ width: '22px', height: '22px', color: '#F0ABFC' }} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#F1F5F9' }}>
            Analytics & Knowledge Gap Detection
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.5 }}>
            Tracks query metrics, classification distribution, latency, and automatically identifies unanswered or low-confidence topics as knowledge gaps.
          </p>
        </div>
      </div>
    </div>
  );
}
