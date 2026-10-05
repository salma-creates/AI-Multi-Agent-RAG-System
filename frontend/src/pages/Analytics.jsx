import React, { useState, useEffect } from 'react';
import { BarChart3, HelpCircle, AlertTriangle, CheckCircle2, RefreshCw, FileText, Sparkles } from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function Analytics({ showToast }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await getAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch analytics metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading analytics metrics...</div>;
  }

  const {
    total_queries = 0,
    query_types = {},
    avg_confidence = 0.0,
    clarification_count = 0,
    low_confidence_count = 0,
    unanswered_count = 0,
    knowledge_gaps = [],
    top_referenced_documents = [],
    frequently_asked_topics = [],
    total_documents = 0,
    total_chunks = 0
  } = data || {};

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFF' }}>Analytics & Knowledge Gap Detection</h1>
          <p style={{ fontSize: '0.88rem', color: '#94A3B8' }}>
            Real-time analytics on user queries, classification breakdown, confidence metrics, and detected knowledge gaps.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchAnalytics} style={{ fontSize: '0.82rem' }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Refresh Analytics
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Total Queries</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FFF' }}>{total_queries}</div>
          <div style={{ fontSize: '0.75rem', color: '#818CF8', marginTop: '0.25rem' }}>{total_chunks} chunks indexed</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Avg RAG Confidence</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: avg_confidence >= 0.7 ? '#34D399' : '#FBBF24' }}>
            {(avg_confidence * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>Calibrated retrieval score</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Clarifications Requested</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FBBF24' }}>{clarification_count}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>Ambiguous queries routed</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Unanswered / Gaps</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F87171' }}>{unanswered_count}</div>
          <div style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '0.25rem' }}>Information not in docs</div>
        </div>
      </div>

      {/* Query Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Category Breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '1rem' }}>
            Query Intent Classification Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { key: 'factual', label: 'Factual Queries', color: '#6366F1' },
              { key: 'procedural', label: 'Procedural Queries', color: '#10B981' },
              { key: 'comparative', label: 'Comparative Queries', color: '#8B5CF6' },
              { key: 'ambiguous', label: 'Ambiguous Queries', color: '#F59E0B' },
              { key: 'general', label: 'General Knowledge Queries', color: '#EC4899' },
            ].map((cat) => {
              const count = query_types[cat.key] || 0;
              const pct = total_queries > 0 ? ((count / total_queries) * 100).toFixed(0) : 0;
              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{cat.label}</span>
                    <span style={{ color: '#94A3B8', fontWeight: 700 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color, transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frequently Asked Topics */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFF', marginBottom: '1rem' }}>
            Frequently Referenced Topics
          </h3>
          {frequently_asked_topics.length === 0 ? (
            <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.88rem' }}>No query topics logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {frequently_asked_topics.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.875rem', borderRadius: '6px', backgroundColor: '#1E293B', fontSize: '0.85rem' }}>
                  <span style={{ color: '#F1F5F9', fontWeight: 500 }}>{t.topic}</span>
                  <span className="badge badge-purple">{t.frequency} {t.frequency === 1 ? 'query' : 'queries'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Gap Detection Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: '#F87171' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#FFF' }}>
            Detected Knowledge Gaps ({knowledge_gaps.length})
          </h3>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '1rem' }}>
          Queries that yielded low retrieval scores or for which information was missing from the knowledge base. Use this to identify what new documents should be uploaded.
        </p>

        {knowledge_gaps.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#34D399', fontSize: '0.9rem' }}>
            <CheckCircle2 style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem' }} />
            No knowledge gaps detected! All user queries were answered with high confidence.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94A3B8', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Unanswered Query</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Intent Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Gap Reason</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Best Score</th>
                </tr>
              </thead>
              <tbody>
                {knowledge_gaps.map((gap, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#F8FAFC' }}>
                      "{gap.query_text}"
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#A5B4FC', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                      {gap.query_type}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#FCA5A5', fontSize: '0.82rem' }}>
                      {gap.reason}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#F59E0B' }}>
                      {(gap.best_score * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
