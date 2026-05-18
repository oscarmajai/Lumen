import { knowledgeBasesController } from '../controllers/knowledge-bases.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

export async function knowledgeBasesRoutes(fastify) {
  fastify.get('/', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
  }, knowledgeBasesController.list);

  fastify.post('/', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
    schema: {
      body: {
        type: 'object',
        required: ['area_id', 'dify_dataset_id', 'name'],
        properties: {
          area_id:         { type: 'string' },
          dify_dataset_id: { type: 'string' },
          name:            { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  }, knowledgeBasesController.create);

  fastify.delete('/:id', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
  }, knowledgeBasesController.remove);
}
