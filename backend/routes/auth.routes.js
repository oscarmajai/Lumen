import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { registerSchema, loginSchema, refreshSchema, changePasswordSchema } from '../schemas/auth.schema.js';

export async function authRoutes(fastify) {
  fastify.post('/register', { schema: registerSchema }, authController.register);
  fastify.post('/login',    { schema: loginSchema },    authController.login);
  fastify.post('/refresh',  { schema: refreshSchema },  authController.refresh);

  fastify.get('/me', { preHandler: [authenticate] }, authController.me);

  fastify.put('/change-password', {
    preHandler: [authenticate],
    schema: changePasswordSchema,
  }, authController.changePassword);
}
