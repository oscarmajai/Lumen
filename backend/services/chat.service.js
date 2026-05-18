import { PassThrough } from 'stream';
import { knowledgeBaseRepository } from '../repositories/knowledge-base.repository.js';
import { chatSessionRepository } from '../repositories/chat-session.repository.js';
import { chatMessageRepository } from '../repositories/chat-message.repository.js';
import { difyService } from './dify.service.js';

export const chatService = {
  async sendMessage({ userId, companyId, areaIds, message, sessionId }) {
    // Resolve datasets from authorized areas — NEVER trust dataset IDs from the frontend
    const kbs = await knowledgeBaseRepository.findByAreaIds(areaIds, companyId);
    const datasetIds = kbs.map(kb => kb.dify_dataset_id);

    let session;
    if (sessionId) {
      session = await chatSessionRepository.findById(sessionId, companyId, userId);
      if (!session) throw Object.assign(new Error('Sesión no encontrada'), { statusCode: 404 });
    } else {
      session = await chatSessionRepository.create({
        companyId,
        userId,
        title: message.slice(0, 80),
      });
    }

    await chatMessageRepository.create({ sessionId: session.id, role: 'user', content: message });

    const startMs = Date.now();
    const difyRes = await difyService.chat({
      prompt:         message,
      userId,
      conversationId: session.dify_conversation_id ?? undefined,
      datasetIds,
    });

    if (!session.dify_conversation_id && difyRes.conversation_id) {
      await chatSessionRepository.updateDifyConversationId(session.id, companyId, difyRes.conversation_id);
    }
    await chatSessionRepository.touch(session.id);

    const citations = (difyRes.retriever_resources ?? []).map(r => ({
      document_name: r.document_name,
      file_type:     r.document_name?.split('.').pop()?.toLowerCase() ?? 'file',
      content:       r.content,
      score:         r.score ?? null,
      dataset_name:  r.dataset_name ?? null,
      document_id:   r.document_id ?? null,
    }));

    await chatMessageRepository.create({
      sessionId: session.id,
      role:      'assistant',
      content:   difyRes.answer,
      metadata:  {
        datasets_used: datasetIds,
        tokens:        difyRes.usage,
        response_ms:   Date.now() - startMs,
        citations,
      },
    });

    return { answer: difyRes.answer, session_id: session.id, citations };
  },

  async streamMessage({ userId, companyId, areaIds, message, sessionId }) {
    const kbs = await knowledgeBaseRepository.findByAreaIds(areaIds, companyId);
    const datasetIds = kbs.map(kb => kb.dify_dataset_id);

    let session;
    if (sessionId) {
      session = await chatSessionRepository.findById(sessionId, companyId, userId);
      if (!session) throw Object.assign(new Error('Sesión no encontrada'), { statusCode: 404 });
    } else {
      session = await chatSessionRepository.create({ companyId, userId, title: message.slice(0, 80) });
    }
    await chatMessageRepository.create({ sessionId: session.id, role: 'user', content: message });

    const startMs = Date.now();
    const difyStream = await difyService.chatStream({
      prompt:         message,
      userId,
      conversationId: session.dify_conversation_id ?? undefined,
      datasetIds,
    });

    const passThrough = new PassThrough();
    let sseBuffer = '';
    let fullAnswer = '';
    let difyConvId = session.dify_conversation_id;
    let citations = [];

    difyStream.on('data', (chunk) => {
      passThrough.write(chunk);
      sseBuffer += chunk.toString();
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6).trim());
          if (event.event === 'message' || event.event === 'agent_message') {
            fullAnswer += event.answer || '';
          }
          if (event.event === 'message_end') {
            if (!difyConvId && event.conversation_id) difyConvId = event.conversation_id;
            citations = (event.metadata?.retriever_resources ?? []).map(r => ({
              document_name: r.document_name,
              file_type:     r.document_name?.split('.').pop()?.toLowerCase() ?? 'file',
              content:       r.content,
              score:         r.score ?? null,
              dataset_name:  r.dataset_name ?? null,
              document_id:   r.document_id ?? null,
            }));
          }
        } catch {}
      }
    });

    difyStream.on('end', async () => {
      passThrough.end();
      try {
        if (!session.dify_conversation_id && difyConvId) {
          await chatSessionRepository.updateDifyConversationId(session.id, companyId, difyConvId);
        }
        await chatSessionRepository.touch(session.id);
        if (fullAnswer) {
          await chatMessageRepository.create({
            sessionId: session.id,
            role:      'assistant',
            content:   fullAnswer,
            metadata:  { datasets_used: datasetIds, response_ms: Date.now() - startMs, citations },
          });
        }
      } catch (e) {
        console.error('Failed to persist streamed message:', e);
      }
    });

    difyStream.on('error', (err) => passThrough.destroy(err));

    return { stream: passThrough, sessionId: session.id };
  },

  async stopGenerate({ taskId, userId }) {
    await difyService.stopGenerate({ taskId, userId });
  },

  async previewFile({ fileId }) {
    return difyService.previewFile({ fileId });
  },

  async getSessions({ companyId, userId, page = 1, limit = 20 }) {
    return chatSessionRepository.findAllByUser(companyId, userId, limit, (page - 1) * limit);
  },

  async getMessages({ sessionId, companyId, userId, page = 1, limit = 100 }) {
    const session = await chatSessionRepository.findById(sessionId, companyId, userId);
    if (!session) throw Object.assign(new Error('Sesión no encontrada'), { statusCode: 404 });
    return chatMessageRepository.findBySession(sessionId, limit, (page - 1) * limit);
  },

  async deleteSession({ sessionId, companyId, userId }) {
    const session = await chatSessionRepository.findById(sessionId, companyId, userId);
    if (!session) throw Object.assign(new Error('Sesión no encontrada'), { statusCode: 404 });
    await chatSessionRepository.deleteById(sessionId, companyId, userId);
  },
};
