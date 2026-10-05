import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument } from '../services/api';

export default function KnowledgeBase({ showToast, onDocumentUploaded }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      setIsLoading(true);
      const res = await getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch document inventory from backend.', 'error');
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
      const res = await uploadDocument(file);
      showToast(res.message || `Successfully ingested ${file.name}`, 'success');
      await fetchDocs();
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      console.error('Upload Error:', err);
      showToast(err.message || `Failed to upload ${file.name}`, 'error');
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1E293B' }}>Knowledge Base Management</h1>
          <p style={{ fontSize: '0.88rem', color: '#64748B', fontWeight: 500 }}>
            Upload knowledge documents (PDF, DOCX, TXT, CSV) to index them into the semantic vector store.
          </p>
        </div>

        <button className="btn-secondary" onClick={fetchDocs} disabled={isLoading} style={{ fontSize: '0.82rem' }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} className={isLoading ? 'animate-spin-fast' : ''} />
          Refresh Inventory
        </button>
      </div>

      {/* Upload Box */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem', border: '2px dashed #FEF08A', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#FEF08A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Upload style={{ width: '28px', height: '28px', color: '#D97706' }} />
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1E293B' }}>
          Upload Knowledge Document
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: '1.5rem' }}>
          Supported formats: <strong>PDF, DOCX, TXT, CSV</strong> (Max 30MB)
        </p>

        <div>
          <label className="btn-primary" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}>
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>
            Ingested Documents ({documents.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Live status from backend database
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>Loading document inventory...</div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontWeight: 500 }}>
            No documents ingested yet. Upload a PDF, DOCX, TXT, or CSV file above to index its contents for RAG search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #FEF08A', color: '#64748B', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Document Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Format</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Size</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Indexed Chunks</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.document_id} style={{ borderBottom: '1px solid #FEF9C3' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#1E293B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText style={{ width: '16px', height: '16px', color: '#D97706' }} />
                        <span>{doc.document_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textTransform: 'uppercase', fontSize: '0.78rem', color: '#D97706', fontWeight: 700 }}>
                      {doc.file_type}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#64748B', fontSize: '0.82rem' }}>
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
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 800, color: '#D97706' }}>
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
