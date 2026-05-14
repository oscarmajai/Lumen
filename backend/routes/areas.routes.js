import { areasController } from '../controllers/areas.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { createAreaSchema, updateAreaSchema } from '../schemas/area.schema.js';

export async function areasRoutes(fastify) {
  fastify.get('/', { preHandler: [authenticate] }, areasController.list);

  fastify.get('/:id', { preHandler: [authenticate] }, areasController.getById);

  fastify.post('/', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
    schema: createAreaSchema,
  }, areasController.create);

  fastify.put('/:id', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
    schema: updateAreaSchema,
  }, areasController.update);
}
