/**
 * Lumina AI - API Client Service
 * Encapsulates all backend REST calls to FastAPI.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function uploadDocument(file, domain = 'general') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', domain);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Upload failed');
  }
  return data;
}

export async function queryPipeline({ query, top_k = 3, similarity_threshold = 0.60, conversation_id = null, domain = 'all', clarification_response = null }) {
  const res = await fetch(`${API_BASE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      top_k: Number(top_k),
      similarity_threshold: Number(similarity_threshold),
      conversation_id,
      domain,
      clarification_response,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Pipeline execution failed');
  }
  return data;
}

export async function getDocuments() {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) throw new Error('Failed to fetch document inventory');
  return res.json();
}

export async function deleteDocument(documentId) {
  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to delete document');
  return data;
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE_URL}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics summary');
  return res.json();
}

export async function getConversations() {
  const res = await fetch(`${API_BASE_URL}/conversations`);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function getConversationHistory(conversationId) {
  const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation history');
  return res.json();
}

export async function createConversation() {
  const res = await fetch(`${API_BASE_URL}/conversations`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create new conversation');
  return res.json();
}

export async function getSettings() {
  const res = await fetch(`${API_BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}

export async function preloadBenchmark() {
  const res = await fetch(`${API_BASE_URL}/test/preload-benchmark`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Benchmark preloading failed');
  return data;
}
