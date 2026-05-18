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

  async stream(request, reply) {
    reply.hijack(); // Must hijack before any async work so Fastify never touches this reply
    try {
      const { userId, companyId, areaIds = [] } = request.user;
      const { message, session_id } = request.body;
      const { stream, sessionId } = await chatService.streamMessage({
        userId, companyId, areaIds, message, sessionId: session_id,
      });

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Session-Id', sessionId);
      stream.pipe(reply.raw);

      request.raw.on('close', () => stream.destroy());
    } catch (err) {
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json' });
      }
      reply.raw.end(JSON.stringify({ error: err.message }));
    }
  },

  async stop(request, reply) {
    try {
      const { userId } = request.user;
      const { taskId } = request.params;
      await chatService.stopGenerate({ taskId, userId });
      return reply.send({ message: 'Generación detenida' });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  },

  async previewFile(request, reply) {
    reply.hijack();
    try {
      const { fileId } = request.params;
      const { stream, contentType, contentDisposition } = await chatService.previewFile({ fileId });

      reply.raw.setHeader('Content-Type', contentType);
      if (contentDisposition) reply.raw.setHeader('Content-Disposition', contentDisposition);
      stream.pipe(reply.raw);

      request.raw.on('close', () => stream.destroy());
    } catch (err) {
      if (!reply.raw.headersSent) {
        reply.raw.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json' });
      }
      reply.raw.end(JSON.stringify({ error: err.message }));
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
