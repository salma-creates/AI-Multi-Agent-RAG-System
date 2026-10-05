import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TransparencyPanel({ responseData }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!responseData) return null;

  const {
    sources = [],
    confidence = 0.0,
    confidence_label = 'unavailable',
    is_general_knowledge = false,
    query_type = 'factual',
    classification_confidence = 0.0,
    embedding_model = 'gemini-embedding-001',
    llm_model = 'gemini-3.8-flash',
    latency_ms = 0
  } = responseData;

  const getConfidenceBadgeClass = (label) => {
    switch (label) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-unavailable';
    }
  };

  return (
    <div style={{
      marginTop: '1rem',
      borderRadius: '10px',
      backgroundColor: '#172033',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'none',
          border: 'none',
          color: '#E5E7EB',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck style={{ width: '18px', height: '18px', color: '#818CF8' }} />
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
            Sources & Response Transparency ({sources.length} {sources.length === 1 ? 'Source' : 'Sources'})
          </span>
          <span className={`badge ${getConfidenceBadgeClass(confidence_label)}`}>
            {(confidence * 100).toFixed(0)}% {confidence_label}
          </span>
          {is_general_knowledge && (
            <span className="badge badge-purple">General AI Knowledge</span>
          )}
        </div>
        {isOpen ? <ChevronUp style={{ width: '18px', height: '18px' }} /> : <ChevronDown style={{ width: '18px', height: '18px' }} />}
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0F172A',
          fontSize: '0.85rem'
        }}>
          {/* Metadata Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#1E293B',
            marginBottom: '1rem',
            color: '#94A3B8',
            fontSize: '0.78rem'
          }}>
            <div>
              <strong style={{ color: '#E2E8F0' }}>Query Classification:</strong> {query_type} ({(classification_confidence * 100).toFixed(0)}%)
            </div>
            <div>
              <strong style={{ color: '#E2E8F0' }}>Embedding Model:</strong> {embedding_model}
            </div>
            <div>
              <strong style={{ color: '#E2E8F0' }}>LLM Model:</strong> {llm_model}
            </div>
            <div>
              <strong style={{ color: '#E2E8F0' }}>Pipeline Latency:</strong> {latency_ms} ms
            </div>
          </div>

          {/* Sources List */}
          {sources.length === 0 ? (
            <div style={{ color: '#94A3B8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
              {is_general_knowledge
                ? 'Answer generated from general AI knowledge. No private document sources were referenced.'
                : 'No matching document chunks met the relevance threshold.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818CF8', fontWeight: 700 }}>
                Retrieved Supporting Evidence:
              </div>

              {sources.map((src, i) => (
                <div key={i} style={{
                  padding: '0.875rem',
                  borderRadius: '8px',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#F1F5F9' }}>
                      <FileText style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
                      <span>{src.document_name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>({src.page})</span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: src.relevance_score >= 0.70 ? '#34D399' : '#FBBF24',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Relevance: {(src.relevance_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.82rem',
                    color: '#CBD5E1',
                    fontFamily: 'monospace',
                    backgroundColor: '#0F172A',
                    padding: '0.625rem',
                    borderRadius: '6px',
                    lineHeight: 1.4,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '180px',
                    overflowY: 'auto'
                  }}>
                    {src.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
