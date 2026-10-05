import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, Clock, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, preloadBenchmark } from '../services/api';

export default function KnowledgeBase({ showToast, onDocumentUploaded }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('general');

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch documents list.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const res = await uploadDocument(file, selectedDomain);
      showToast(res.message || `Successfully ingested ${file.name}`, 'success');
      await fetchDocs();
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      console.error(err);
      showToast(err.message || `Failed to process ${file.name}`, 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to remove '${docName}' from the knowledge base?`)) return;

    try {
      await deleteDocument(docId);
      showToast(`Removed '${docName}' from knowledge base.`, 'success');
      await fetchDocs();
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      showToast(err.message || 'Failed to delete document.', 'error');
    }
  };

  const handlePreloadBenchmark = async () => {
    try {
      setIsPreloading(true);
      const res = await preloadBenchmark();
      showToast(res.message || 'Benchmark test document ingested!', 'success');
      await fetchDocs();
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      showToast(err.message || 'Preloading failed.', 'error');
    } finally {
      setIsPreloading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#451A03' }}>Knowledge Base Management</h1>
          <p style={{ fontSize: '0.88rem', color: '#854D0E', fontWeight: 500 }}>
            Upload knowledge documents (PDF, DOCX, TXT, CSV) to immediately index them into the semantic vector store.
          </p>
        </div>

        <button className="btn-secondary" onClick={handlePreloadBenchmark} disabled={isPreloading}>
          <Database style={{ width: '16px', height: '16px', color: '#D97706' }} />
          {isPreloading ? 'Preloading Test Doc...' : 'Preload Benchmark Doc'}
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', border: '2px dashed #FDE047', textAlign: 'center', backgroundColor: '#FFFDF0' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Upload style={{ width: '26px', height: '26px', color: '#D97706' }} />
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem', color: '#451A03' }}>
          Upload Knowledge Document
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#854D0E', marginBottom: '1.25rem' }}>
          Supported formats: <strong>PDF, DOCX, TXT, CSV</strong> (Max 30MB)
        </p>

        {/* Domain selection */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', backgroundColor: '#FFFFFF', border: '1px solid #FEF08A', padding: '0.5rem 1rem', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: '#713F12', fontWeight: 600 }}>Target Domain:</span>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{ backgroundColor: '#FEF9C3', color: '#451A03', border: '1px solid #FDE047', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.82rem', outline: 'none', fontWeight: 600 }}
          >
            <option value="general">General Knowledge</option>
            <option value="tech">Technology & Operations</option>
            <option value="medical">Medical & Life Sciences</option>
            <option value="lumina_test">Lumina RAG Test</option>
          </select>
        </div>

        <div>
          <label className="btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            <Upload style={{ width: '18px', height: '18px' }} />
            <span>{isUploading ? 'Ingesting & Embedding Document...' : 'Select File to Ingest'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Document Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#451A03' }}>
            Ingested Documents ({documents.length})
          </h3>
          <button className="btn-secondary" onClick={fetchDocs} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#854D0E' }}>Loading document inventory...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#854D0E', fontWeight: 500 }}>
            No documents ingested yet. Upload a PDF, DOCX, TXT, or CSV file above to start querying!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #FEF08A', color: '#854D0E', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Document Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Format</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Domain</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Chunks</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id} style={{ borderBottom: '1px solid #FEF08A' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#1E293B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText style={{ width: '16px', height: '16px', color: '#D97706' }} />
                        <span>{doc.document_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textTransform: 'uppercase', fontSize: '0.78rem', color: '#78350F', fontWeight: 600 }}>
                      {doc.file_type}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#451A03', fontWeight: 500 }}>
                      {doc.domain}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#78350F', fontSize: '0.82rem' }}>
                      {formatBytes(doc.file_size)}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      {doc.processing_status === 'ready' && (
                        <span className="badge badge-high">Ready</span>
                      )}
                      {doc.processing_status === 'processing' && (
                        <span className="badge badge-medium">Processing</span>
                      )}
                      {doc.processing_status === 'failed' && (
                        <span className="badge badge-low" title={doc.error_message}>Failed</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#B45309' }}>
                      {doc.chunk_count}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(doc.document_id, doc.document_name)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                        Delete
                      </button>
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
