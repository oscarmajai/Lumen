// Frontend API client for Lumen backend endpoints proxied under /api
// Uses native fetch; all paths are relative so Vite dev server proxies to Fastify

export interface ChatResponse {
  answer: string;
  conversation_id?: string;
}

export async function chat(message: string, userId: string = 'lumen-user'): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, user_id: userId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

// Documents & Uploads
export interface DocumentItem {
  id: string;
  name: string;
  status?: string;
  created_at?: string;
  size?: number;
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Documents error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  // Dify list may be in data.data or data.items; normalize best-effort
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
  return items.map((it: any) => ({
    id: it.id || it.document_id || String(it.uuid || it._id || it.id || Math.random()),
    name: it.name || it.filename || it.title || 'Documento',
    status: it.status || it.indexing_status || it.processing_status,
    created_at: it.created_at || it.createdAt || it.create_time,
    size: it.size || it.file_size,
  }));
}

export interface UploadResult {
  document_id: string;
  batch?: string;
  name?: string;
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export interface IndexStatus {
  id: string;
  name?: string;
  technicalStatus: 'queued' | 'indexing' | 'completed' | 'error' | 'paused' | string;
  percent: number;
  errorMsg?: string;
}

export async function getIndexStatus(documentId: string): Promise<IndexStatus> {
  const res = await fetch(`/api/status/${encodeURIComponent(documentId)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Status error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
