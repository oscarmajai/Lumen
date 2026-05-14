import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';

const http = axios.create({
  baseURL: config.DIFY_API_URL,
  timeout: 60_000,
});

// Converts an AxiosError into a plain Error with statusCode so controllers
// can return the real HTTP status instead of always falling back to 500.
function rethrowDify(err) {
  if (err.response) {
    const body = err.response.data;
    const msg = body?.message || body?.error || body?.detail || err.message;
    throw Object.assign(new Error(`Dify: ${msg}`), { statusCode: err.response.status });
  }
  throw err;
}

export const difyService = {
  async chat({ prompt, userId, conversationId, datasetIds }) {
    const response = await http.post('/chat-messages', {
      inputs:        datasetIds?.length ? { dataset_ids: datasetIds } : {},
      query:         prompt,
      response_mode: 'blocking',
      user:          userId,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }, {
      headers: { Authorization: `Bearer ${config.DIFY_CHAT_API_KEY}` },
    }).catch(rethrowDify);
    return {
      answer:               response.data.answer,
      conversation_id:      response.data.conversation_id,
      usage:                response.data.metadata?.usage ?? null,
      retriever_resources:  response.data.metadata?.retriever_resources ?? [],
    };
  },

  async uploadFile({ buffer, filename, datasetId }) {
    const form = new FormData();
    form.append('file', buffer, { filename });
    form.append('data', JSON.stringify({
      indexing_technique: 'high_quality',
      process_rule: { mode: 'automatic' },
    }));
    const response = await http.post(
      `/datasets/${datasetId}/document/create_by_file`,
      form,
      { headers: { Authorization: `Bearer ${config.DIFY_DATASET_API_KEY}`, ...form.getHeaders() } }
    ).catch(rethrowDify);
    return { document_id: response.data.document.id, batch: response.data.batch, name: filename };
  },

  async getDocumentStatus({ datasetId, documentId }) {
    const response = await http.get(
      `/datasets/${datasetId}/documents/${documentId}/indexing-status`,
      { headers: { Authorization: `Bearer ${config.DIFY_DATASET_API_KEY}` } }
    ).catch(rethrowDify);
    const item = Array.isArray(response.data?.data) ? response.data.data[0] : null;
    if (!item) return { id: documentId, technicalStatus: 'queued', percent: 0, errorMsg: '' };

    const status = (item.indexing_status || item.status || '').toLowerCase();
    const completed = Number(item.completed_segments ?? item.completed ?? 0);
    const total = Number(item.total_segments ?? item.total ?? 0);
    const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100))
      : status === 'completed' ? 100 : 5;

    return {
      id:              item.document_id || item.id || documentId,
      name:            item.document_name || item.name || '',
      technicalStatus: status || 'queued',
      percent,
      errorMsg:        item.error || item.error_msg || '',
    };
  },

  async listDocuments(datasetId) {
    const response = await http.get(
      `/datasets/${datasetId}/documents?limit=100`,
      { headers: { Authorization: `Bearer ${config.DIFY_DATASET_API_KEY}` } }
    ).catch(rethrowDify);
    return response.data;
  },
};
