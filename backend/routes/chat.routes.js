import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { sendMessageSchema } from '../schemas/chat.schema.js';

export async function chatRoutes(fastify) {
  fastify.post('/', {
    preHandler: [authenticate],
    schema: sendMessageSchema,
  }, chatController.send);

  fastify.get('/sessions', {
    preHandler: [authenticate],
  }, chatController.getSessions);

  fastify.get('/sessions/:sessionId/messages', {
    preHandler: [authenticate],
  }, chatController.getMessages);

  fastify.delete('/sessions/:sessionId', {
    preHandler: [authenticate],
  }, chatController.deleteSession);
}
