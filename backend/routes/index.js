import { authRoutes }           from './auth.routes.js';
import { areasRoutes }          from './areas.routes.js';
import { usersRoutes }          from './users.routes.js';
import { knowledgeBasesRoutes } from './knowledge-bases.routes.js';
import { chatRoutes }           from './chat.routes.js';
import { documentsRoutes }      from './documents.routes.js';

export async function registerRoutes(fastify) {
  fastify.register(authRoutes,           { prefix: '/api/auth' });
  fastify.register(areasRoutes,          { prefix: '/api/areas' });
  fastify.register(usersRoutes,          { prefix: '/api/users' });
  fastify.register(knowledgeBasesRoutes, { prefix: '/api/knowledge-bases' });
  fastify.register(chatRoutes,           { prefix: '/api/chat' });
  fastify.register(documentsRoutes,      { prefix: '/api/documents' });
}
