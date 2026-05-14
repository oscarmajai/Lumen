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
