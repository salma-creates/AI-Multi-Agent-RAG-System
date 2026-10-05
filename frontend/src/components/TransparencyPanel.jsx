import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

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
      backgroundColor: '#FFFDF0',
      border: '1px solid #FDE047',
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
          color: '#713F12',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <ShieldCheck style={{ width: '18px', height: '18px', color: '#D97706' }} />
          <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
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
          borderTop: '1px solid #FEF08A',
          backgroundColor: '#FFFFFF',
          fontSize: '0.85rem'
        }}>
          {/* Metadata Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: '#FEFCE8',
            border: '1px solid #FEF08A',
            marginBottom: '1rem',
            color: '#475569',
            fontSize: '0.78rem'
          }}>
            <div>
              <strong style={{ color: '#1E293B' }}>Query Classification:</strong> {query_type} ({(classification_confidence * 100).toFixed(0)}%)
            </div>
            <div>
              <strong style={{ color: '#1E293B' }}>Embedding Model:</strong> {embedding_model}
            </div>
            <div>
              <strong style={{ color: '#1E293B' }}>LLM Model:</strong> {llm_model}
            </div>
            <div>
              <strong style={{ color: '#1E293B' }}>Pipeline Latency:</strong> {latency_ms} ms
            </div>
          </div>

          {/* Sources List */}
          {sources.length === 0 ? (
            <div style={{ color: '#854D0E', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#D97706' }} />
              {is_general_knowledge
                ? 'Answer generated from general AI knowledge. No private document sources were referenced.'
                : 'No matching document chunks met the relevance threshold.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#B45309', fontWeight: 800 }}>
                Retrieved Supporting Evidence:
              </div>

              {sources.map((src, i) => (
                <div key={i} style={{
                  padding: '0.875rem',
                  borderRadius: '8px',
                  backgroundColor: '#FFFDF0',
                  border: '1px solid #FEF08A'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#451A03' }}>
                      <FileText style={{ width: '16px', height: '16px', color: '#D97706' }} />
                      <span>{src.document_name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#78350F', fontWeight: 500 }}>({src.page})</span>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: src.relevance_score >= 0.70 ? '#15803D' : '#A16207',
                      backgroundColor: src.relevance_score >= 0.70 ? '#DCFCE7' : '#FEF9C3',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      Relevance: {(src.relevance_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div style={{
                    fontSize: '0.82rem',
                    color: '#334155',
                    fontFamily: 'monospace',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FEF08A',
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
