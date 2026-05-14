import { documentsController } from '../controllers/documents.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

export async function documentsRoutes(fastify) {
  fastify.post('/upload', { preHandler: [authenticate] }, documentsController.upload);
  fastify.get('/status/:documentId', { preHandler: [authenticate] }, documentsController.getStatus);
  fastify.get('/', { preHandler: [authenticate] }, documentsController.list);
}
