import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';

const http = axios.create({
  baseURL: config.DIFY_API_URL,
  timeout: 60_000,
});

const MIME_MAP = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt:  'text/plain',
  md:   'text/markdown',
  csv:  'text/csv',
};

export function guessMime(filename) {
  const ext = (filename ?? '').split('.').pop()?.toLowerCase();
  return MIME_MAP[ext] || 'application/octet-stream';
}

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
      inputs:        { dataset_ids: datasetIds ?? [] },
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

  async uploadFile({ buffer, filename, mimetype, datasetId }) {
    // Fetch dataset metadata so we send matching indexing_technique + doc_form.
    // Dify rejects the upload if these differ from the dataset's own config.
    const dsRes = await http.get(
      `/datasets/${datasetId}`,
      { headers: { Authorization: `Bearer ${config.DIFY_DATASET_API_KEY}` } }
    ).catch(rethrowDify);

    const { indexing_technique, doc_form } = dsRes.data;

    const contentType = mimetype || guessMime(filename);

    console.log('[UPLOAD] filename:', filename, '| mime:', contentType, '| buffer bytes:', buffer.length);
    if (buffer.length === 0) throw Object.assign(new Error('El buffer del archivo está vacío'), { statusCode: 400 });

    // Build only the fields Dify actually uses at document level.
    // Do NOT default doc_form — if the dataset doesn't expose it, omitting it
    // lets Dify inherit the dataset's own setting instead of overriding it.
    const documentData = {
      name:               filename,
      indexing_technique: indexing_technique ?? 'high_quality',
      process_rule:       { mode: 'automatic' },
      ...(doc_form ? { doc_form } : {}),
    };

    const form = new FormData();
    form.append('file', buffer, { filename, contentType, knownLength: buffer.length });
    form.append('data', JSON.stringify(documentData));

    // ── Punto 2: Content-Length explícito + maxBodyLength ilimitado ────────
    // Axios calcula Content-Length leyendo el stream si no se provee, lo que
    // consume el readable antes de enviarlo y puede resultar en un cuerpo vacío.
    const contentLength = await new Promise((resolve, reject) => {
      form.getLength((err, len) => (err ? reject(err) : resolve(len)));
    });

    const response = await http.post(
      `/datasets/${datasetId}/document/create_by_file`,
      form,
      {
        headers: {
          Authorization:  `Bearer ${config.DIFY_DATASET_API_KEY}`,
          ...form.getHeaders(),
          'Content-Length': contentLength,
        },
        maxBodyLength:    Infinity,
        maxContentLength: Infinity,
      }
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

  async chatStream({ prompt, userId, conversationId, datasetIds }) {
    const response = await http.post('/chat-messages', {
      inputs:        { dataset_ids: datasetIds ?? [] },
      query:         prompt,
      response_mode: 'streaming',
      user:          userId,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }, {
      headers:          { Authorization: `Bearer ${config.DIFY_CHAT_API_KEY}` },
      responseType:     'stream',
      timeout:          0,            // no timeout — streaming responses can last minutes
      maxBodyLength:    Infinity,
      maxContentLength: Infinity,
    }).catch(rethrowDify);
    return response.data;
  },

  async stopGenerate({ taskId, userId }) {
    await http.post(
      `/chat-messages/${taskId}/stop`,
      { user: userId },
      { headers: { Authorization: `Bearer ${config.DIFY_CHAT_API_KEY}` } }
    ).catch(rethrowDify);
  },

  async previewFile({ fileId }) {
    const response = await http.get(`/files/${fileId}/preview`, {
      headers:      { Authorization: `Bearer ${config.DIFY_CHAT_API_KEY}` },
      responseType: 'stream',
    }).catch(rethrowDify);
    return {
      stream:             response.data,
      contentType:        response.headers['content-type']        ?? 'application/octet-stream',
      contentDisposition: response.headers['content-disposition'] ?? null,
    };
  },
};
