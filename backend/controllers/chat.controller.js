import { chatService } from '../services/chat.service.js';

export const chatController = {
  async send(request, reply) {
    try {
      const { userId, companyId, areaIds = [] } = request.user;
      const { message, session_id } = request.body;
      return reply.send(await chatService.sendMessage({ userId, companyId, areaIds, message, sessionId: session_id }));
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async getSessions(request, reply) {
    try {
      const { page = 1, limit = 20 } = request.query;
      const sessions = await chatService.getSessions({
        companyId: request.user.companyId,
        userId:    request.user.userId,
        page:      Number(page),
        limit:     Number(limit),
      });
      return reply.send({ sessions });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async getMessages(request, reply) {
    try {
      const { page = 1, limit = 100 } = request.query;
      const messages = await chatService.getMessages({
        sessionId: request.params.sessionId,
        companyId: request.user.companyId,
        userId:    request.user.userId,
        page:      Number(page),
        limit:     Number(limit),
      });
      return reply.send({ messages });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async deleteSession(request, reply) {
    try {
      await chatService.deleteSession({
        sessionId: request.params.sessionId,
        companyId: request.user.companyId,
        userId:    request.user.userId,
      });
      return reply.send({ message: 'Conversación eliminada' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },
};
