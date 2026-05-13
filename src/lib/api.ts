// ─── Auth helpers ────────────────────────────────────────────────────────────

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers as Record<string, string>) },
  });
  return res;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  company_name: string;
  admin_name: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  message: string;
  company: { id: string; name: string; slug: string };
  user: { id: string; email: string; role: string };
}

export async function registerCompany(data: RegisterPayload): Promise<RegisterResult> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export interface LoginPayload { email: string; password: string; company_slug: string; }

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  must_change_password: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
    companyId: string;
    areaIds: string[];
  };
}

export async function loginUser(data: LoginPayload): Promise<LoginResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}

export async function changePassword(body: { current_password: string; new_password: string }): Promise<void> {
  const res = await authFetch('/api/auth/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
}

export async function refreshAccessToken(refresh_token: string): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error('Sesión expirada');
  return res.json();
}

// ─── Areas API ───────────────────────────────────────────────────────────────

export interface Area {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: number;
  created_at: string;
}

export async function getAreas(): Promise<Area[]> {
  const res = await authFetch('/api/areas');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.areas;
}

export async function createArea(body: { name: string; description?: string }): Promise<Area> {
  const res = await authFetch('/api/areas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.area;
}

export async function getAreaById(id: string): Promise<Area> {
  const res = await authFetch(`/api/areas/${id}`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.area;
}

export async function updateArea(id: string, body: { name?: string; description?: string; is_active?: boolean }): Promise<void> {
  const res = await authFetch(`/api/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
}

// ─── Users Admin API ──────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'EMPLOYEE';
  must_change_password: number;
  is_active: number;
  created_at: string;
  areas: Array<{ area_id: string; area_name: string }>;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  area_ids?: string[];
}

export interface CreatedUser extends AdminUser {
  temporary_password: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await authFetch('/api/users');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.users;
}

export async function createAdminUser(body: CreateUserPayload): Promise<CreatedUser> {
  const res = await authFetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.user;
}

export async function updateAdminUser(id: string, body: { name?: string; role?: string; is_active?: boolean; area_ids?: string[] }): Promise<void> {
  const res = await authFetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
}

// ─── Knowledge Bases API ──────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string;
  company_id: string;
  area_id: string;
  area_name: string;
  dify_dataset_id: string;
  name: string;
  is_active: number;
  created_at: string;
}

export async function getKnowledgeBases(): Promise<KnowledgeBase[]> {
  const res = await authFetch('/api/knowledge-bases');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.knowledge_bases;
}

export async function createKnowledgeBase(body: { area_id: string; dify_dataset_id: string; name: string }): Promise<KnowledgeBase> {
  const res = await authFetch('/api/knowledge-bases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
  const data = await res.json();
  return data.knowledge_base;
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const res = await authFetch(`/api/knowledge-bases/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error || `Error ${res.status}`);
  }
}

// ─── Chat API ─────────────────────────────────────────────────────────────────

export interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Citation {
  document_name: string;
  file_type: string;
  content: string;
  score: number | null;
  dataset_name: string | null;
}

export interface ChatResponse {
  answer: string;
  session_id?: string;
  citations?: Citation[];
}

export async function chat(message: string, sessionId?: string): Promise<ChatResponse> {
  const res = await authFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const res = await authFetch('/api/chat/sessions');
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.sessions;
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await authFetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  const data = await res.json();
  return data.messages;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const res = await authFetch(`/api/chat/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error((b as any).error || `Error ${res.status}`);
  }
}

// ─── Documents API ────────────────────────────────────────────────────────────

export interface DocumentItem {
  id: string;
  name: string;
  status?: string;
  percent?: number;
  created_at?: string;
  size?: number;
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const res = await authFetch('/api/documents');
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Documents error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data?.items) ? data.items : [];
  return items.map((it: any) => ({
    id: it.id || it.document_id || String(it.uuid || it._id || Math.random()),
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
  const res = await authFetch('/api/documents/upload', { method: 'POST', body: form });
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
  const res = await authFetch(`/api/documents/status/${encodeURIComponent(documentId)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Status error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
