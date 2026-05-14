import { usersController } from '../controllers/users.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

export async function usersRoutes(fastify) {
  fastify.get('/', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
  }, usersController.list);

  fastify.post('/', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
    schema: createUserSchema,
  }, usersController.create);

  fastify.put('/:id', {
    preHandler: [authenticate, authorize('OWNER', 'ADMIN')],
    schema: updateUserSchema,
  }, usersController.update);
}
